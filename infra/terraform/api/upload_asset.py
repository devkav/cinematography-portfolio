import io
import json
import os

import boto3
from boto3.dynamodb.conditions import Attr, Key
from PIL import Image, ImageOps

from common import build_response, is_allowed_origin, get_asset_id, AssetType, Page

TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")
BUCKET_NAME = os.getenv("ASSETS_BUCKET_NAME")

VALID_PAGES = {Page.PHOTO, Page.FILM}

MAX_DIMENSION = 2048
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

        collection_response = table.get_item(
            Key={"Type": AssetType.PHOTO_COLLECTION.value, "AssetID": collection_asset_id}
        )
        is_new_collection = "Item" not in collection_response

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
            img = ImageOps.exif_transpose(img)
            width, height = img.size

            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                ratio = min(MAX_DIMENSION / width, MAX_DIMENSION / height)
                img = img.resize((round(width * ratio), round(height * ratio)), Image.LANCZOS)

            clean = Image.new(img.mode, img.size)
            clean.putdata(img.get_flattened_data())
            img = clean

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
            collections = table.query(
                KeyConditionExpression=Key("Type").eq(AssetType.PHOTO_COLLECTION.value),
                Select="COUNT",
            )

            table.put_item(Item={
                "Type": AssetType.PHOTO_COLLECTION.value,
                "AssetID": collection_asset_id,
                "title": collection,
                "order": collections["Count"] + 1,
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

    return build_response(200, {"ok": True}, origin)
