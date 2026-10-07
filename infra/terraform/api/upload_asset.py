import io
import json
import os
import re

import boto3
from boto3.dynamodb.conditions import Attr, Key
from PIL import Image, ImageOps

from common import build_response, is_allowed_origin, get_asset_id, AssetType, Page

TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")
BUCKET_NAME = os.getenv("ASSETS_BUCKET_NAME")

RESUME_DISTRIBUTION_IDS = [os.getenv("ASSETS_DISTRIBUTION_ID"), os.getenv("STATIC_DISTRIBUTION_ID")]

VALID_PAGES = {Page.PHOTO, Page.FILM, Page.RESUME}

UUID_PATTERN = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
UPLOAD_FILE_PATTERN = rf"{UUID_PATTERN}\.(jpg|png|webp|avif)"
RESUME_UPLOAD_PATTERN = rf"uploads/resume/{UUID_PATTERN}\.pdf"
RESUME_KEY = "resume.pdf"
RESUME_CACHE_CONTROL = "max-age=300"
MAX_RESUME_BYTES = 10 * 1024 * 1024
MAX_DIMENSION = 2048
RESIZE_REDUCING_GAP = 3.0
DEFAULT_QUALITY = 85

CONVERT_TO_JPEG = {".webp"}

FORMAT_BY_EXTENSION = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".webp": "WEBP",
    ".avif": "AVIF",
}

CONTENT_TYPE_BY_FORMAT = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
    "AVIF": "image/avif",
}

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
s3 = boto3.client("s3")
cloudfront = boto3.client("cloudfront")


def handler(event, _):
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    page = body.get("page")
    key = body.get("key")

    if page not in VALID_PAGES:
        return build_response(400, {"error": f"Invalid page: '{page}'"}, origin)

    if not key:
        return build_response(400, {"error": "Missing key"}, origin)

    if page == Page.RESUME:
        if not re.fullmatch(RESUME_UPLOAD_PATTERN, key):
            return build_response(400, {"error": "Invalid key"}, origin)

        try:
            size = s3.head_object(Bucket=BUCKET_NAME, Key=key)["ContentLength"]
            signature = s3.get_object(Bucket=BUCKET_NAME, Key=key, Range="bytes=0-4")["Body"].read()
        except s3.exceptions.ClientError:
            return build_response(404, {"error": "Uploaded file not found"}, origin)

        if size > MAX_RESUME_BYTES or signature != b"%PDF-":
            s3.delete_object(Bucket=BUCKET_NAME, Key=key)
            return build_response(400, {"error": "Résumé must be a PDF under 10 MB"}, origin)

        s3.copy_object(
            Bucket=BUCKET_NAME,
            Key=RESUME_KEY,
            CopySource={"Bucket": BUCKET_NAME, "Key": key},
            ContentType="application/pdf",
            CacheControl=RESUME_CACHE_CONTROL,
            MetadataDirective="REPLACE",
        )
        s3.delete_object(Bucket=BUCKET_NAME, Key=key)

        for distribution_id in RESUME_DISTRIBUTION_IDS:
            cloudfront.create_invalidation(
                DistributionId=distribution_id,
                InvalidationBatch={
                    "Paths": {"Quantity": 1, "Items": [f"/{RESUME_KEY}"]},
                    "CallerReference": key,
                },
            )

        return build_response(200, {"ok": True}, origin)

    if page == Page.PHOTO:
        collection = body.get("collection")
        folder = body.get("folder")

        if not collection:
            return build_response(400, {"error": "Missing collection"}, origin)

        if not folder:
            return build_response(400, {"error": "Missing folder"}, origin)

        collection_asset_id = get_asset_id(collection)
        folder_asset_id = get_asset_id(folder)
        extension = os.path.splitext(key)[1].lower()

        if extension not in FORMAT_BY_EXTENSION:
            return build_response(400, {"error": f"Unsupported image type: '{extension}'"}, origin)

        if not re.fullmatch(rf"assets/images/photo/{re.escape(folder_asset_id)}/{UPLOAD_FILE_PATTERN}", key):
            return build_response(400, {"error": "Invalid key"}, origin)

        existing_collections = table.query(
            KeyConditionExpression=Key("Type").eq(AssetType.PHOTO_COLLECTION.value),
        )["Items"]
        is_new_collection = not any(
            get_asset_id(item["AssetID"]) == collection_asset_id for item in existing_collections
        )

        folder_response = table.get_item(
            Key={"Type": AssetType.PHOTO_FOLDER.value, "AssetID": folder_asset_id}
        )
        existing_folder = folder_response.get("Item")

        if existing_folder and get_asset_id(existing_folder.get("collection") or "") != collection_asset_id:
            return build_response(
                409,
                {"error": f"Folder '{folder}' already belongs to '{existing_folder.get('collection')}'"},
                origin,
            )

        original = s3.get_object(Bucket=BUCKET_NAME, Key=key)["Body"].read()

        with Image.open(io.BytesIO(original)) as img:
            img.draft("RGB", (MAX_DIMENSION, MAX_DIMENSION))
            icc_profile = img.info.get("icc_profile")
            img = ImageOps.exif_transpose(img)
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS, reducing_gap=RESIZE_REDUCING_GAP)
            img.info = {}

            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            if extension in CONVERT_TO_JPEG:
                image_format = "JPEG"
                optimized_key = f"{os.path.splitext(key)[0]}.jpg"
            else:
                image_format = FORMAT_BY_EXTENSION[extension]
                optimized_key = key

            save_kwargs = {"format": image_format}

            if image_format in ("JPEG", "WEBP", "AVIF"):
                save_kwargs["quality"] = DEFAULT_QUALITY

            if image_format in ("JPEG", "PNG"):
                save_kwargs["optimize"] = True

            if icc_profile:
                save_kwargs["icc_profile"] = icc_profile

            optimized = io.BytesIO()
            img.save(optimized, **save_kwargs)

        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=optimized_key,
            Body=optimized.getvalue(),
            ContentType=CONTENT_TYPE_BY_FORMAT[image_format],
        )

        if optimized_key != key:
            s3.delete_object(Bucket=BUCKET_NAME, Key=key)

        if is_new_collection:
            table.put_item(Item={
                "Type": AssetType.PHOTO_COLLECTION.value,
                "AssetID": collection_asset_id,
                "title": collection,
                "order": len(existing_collections) + 1,
            })

        if existing_folder is None:
            folders = table.query(
                KeyConditionExpression=Key("Type").eq(AssetType.PHOTO_FOLDER.value),
                FilterExpression=Attr("collection").eq(collection_asset_id),
                Select="COUNT",
            )

            table.put_item(Item={
                "Type": AssetType.PHOTO_FOLDER.value,
                "AssetID": folder_asset_id,
                "title": folder,
                "collection": collection_asset_id,
                "order": folders["Count"] + 1,
            })

        photos = table.query(
            KeyConditionExpression=Key("Type").eq(AssetType.PHOTO.value),
            FilterExpression=Attr("folder").eq(folder_asset_id),
            Select="COUNT",
        )

        table.put_item(Item={
            "Type": AssetType.PHOTO.value,
            "AssetID": optimized_key,
            "folder": folder_asset_id,
            "src": optimized_key,
            "order": photos["Count"] + 1,
        })

        return build_response(200, {"ok": True, "id": optimized_key}, origin)

    return build_response(200, {"ok": True}, origin)
