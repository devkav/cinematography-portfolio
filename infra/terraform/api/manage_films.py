import io
import json
import os
import re
import uuid

import boto3
from botocore.exceptions import ClientError
from PIL import Image, ImageOps, UnidentifiedImageError

from common import (
    AssetType,
    build_response,
    by_order,
    is_allowed_origin,
    key_from_src,
    order_update,
    query_type,
    src_url,
    write_updates,
)


TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")
BUCKET_NAME = os.getenv("ASSETS_BUCKET_NAME")
CLOUDFRONT_DOMAIN = os.getenv("ASSETS_CLOUDFRONT_DOMAIN")
TRANSCODE_FUNCTION_NAME = os.getenv("TRANSCODE_FUNCTION_NAME")

FILM_TYPE = AssetType.FILM.value
UUID_PATTERN = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
VIDEO_UPLOAD_PATTERN = rf"uploads/film/{UUID_PATTERN}\.(mp4|mov|webm)"
LAUREL_UPLOAD_PATTERN = rf"uploads/laurel/{UUID_PATTERN}\.(png|webp)"
LAUREL_PREFIX = "assets/images/laurels/"
VIDEO_PREFIX = "assets/videos/"
IMMUTABLE_CACHE_CONTROL = "max-age=31536000, immutable"

MAX_TEXT_LENGTH = 200
MAX_LINK_LENGTH = 500
MAX_LAURELS = 4
MAX_LAUREL_BYTES = 10 * 1024 * 1024
MAX_LAUREL_HEIGHT = 600

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
dynamodb_client = boto3.client("dynamodb")
s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")


class InvalidRequest(Exception):
    pass


def serialize(item):
    return {
        "id": item["AssetID"],
        "title": item.get("title", ""),
        "subtitle": item.get("subtitle", ""),
        "link": item.get("link", ""),
        "laurels": bool(item.get("laurels")),
        "laurelImages": [
            {"key": key, "src": src_url(key, CLOUDFRONT_DOMAIN)} for key in item.get("laurelImages", [])
        ],
        "src": src_url(item.get("src"), CLOUDFRONT_DOMAIN),
        "status": item.get("status", "ready"),
        "statusMessage": item.get("statusMessage"),
    }


def clean_text(value, max_length):
    return str(value).strip()[:max_length] if value else ""


def parse_details(body):
    title = clean_text(body.get("title"), MAX_TEXT_LENGTH)
    subtitle = clean_text(body.get("subtitle"), MAX_TEXT_LENGTH)
    link = clean_text(body.get("link"), MAX_LINK_LENGTH)

    if not title:
        raise InvalidRequest("Title is required")

    if link and not re.match(r"https?://", link):
        raise InvalidRequest("Link must start with http:// or https://")

    return title, subtitle, link


def parse_upload_keys(value, pattern, label):
    keys = value or []

    if not isinstance(keys, list) or not all(isinstance(key, str) and re.fullmatch(pattern, key) for key in keys):
        raise InvalidRequest(f"Invalid {label}")

    return keys


def require_upload(key):
    try:
        return s3.head_object(Bucket=BUCKET_NAME, Key=key)["ContentLength"]
    except ClientError:
        raise InvalidRequest("Uploaded file not found")


def process_laurel(key):
    if require_upload(key) > MAX_LAUREL_BYTES:
        s3.delete_object(Bucket=BUCKET_NAME, Key=key)
        raise InvalidRequest("Laurel images must be under 10 MB")

    original = s3.get_object(Bucket=BUCKET_NAME, Key=key)["Body"].read()

    try:
        with Image.open(io.BytesIO(original)) as img:
            img = ImageOps.exif_transpose(img).convert("RGBA")

            if img.height > MAX_LAUREL_HEIGHT:
                width = round(img.width * MAX_LAUREL_HEIGHT / img.height)
                img = img.resize((width, MAX_LAUREL_HEIGHT), Image.LANCZOS)

            optimized = io.BytesIO()
            img.save(optimized, format="PNG", optimize=True)
    except UnidentifiedImageError:
        raise InvalidRequest("Laurel images must be PNG or WebP")
    finally:
        s3.delete_object(Bucket=BUCKET_NAME, Key=key)

    laurel_key = f"{LAUREL_PREFIX}{uuid.uuid4()}.png"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=laurel_key,
        Body=optimized.getvalue(),
        ContentType="image/png",
        CacheControl=IMMUTABLE_CACHE_CONTROL,
    )

    return laurel_key


def start_transcode(film_id, source_key, job):
    lambda_client.invoke(
        FunctionName=TRANSCODE_FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps({"id": film_id, "sourceKey": source_key, "job": job}),
    )


def delete_owned_object(key, prefix):
    if key.startswith(prefix) and ".." not in key:
        s3.delete_object(Bucket=BUCKET_NAME, Key=key)


def renumber(films):
    write_updates(dynamodb_client, [
        order_update(TABLE_NAME, FILM_TYPE, film["AssetID"], position)
        for position, film in enumerate(by_order(films), 1)
    ])


def create_film(body):
    title, subtitle, link = parse_details(body)
    video_key = body.get("videoKey")

    if not isinstance(video_key, str) or not re.fullmatch(VIDEO_UPLOAD_PATTERN, video_key):
        raise InvalidRequest("A video upload is required")

    laurel_keys = parse_upload_keys(body.get("laurelKeys"), LAUREL_UPLOAD_PATTERN, "laurel images")

    if len(laurel_keys) > MAX_LAURELS:
        raise InvalidRequest(f"At most {MAX_LAURELS} laurel images are allowed")

    require_upload(video_key)

    film_id = str(uuid.uuid4())
    job = uuid.uuid4().hex
    item = {
        "Type": FILM_TYPE,
        "AssetID": film_id,
        "title": title,
        "subtitle": subtitle,
        "laurelImages": [process_laurel(key) for key in laurel_keys],
        "order": len(query_type(table, FILM_TYPE)) + 1,
        "status": "processing",
        "transcodeJob": job,
    }

    if link:
        item["link"] = link

    table.put_item(Item=item)
    start_transcode(film_id, video_key, job)

    return serialize(item)


def update_film(body):
    film_id = body.get("id")
    film = table.get_item(Key={"Type": FILM_TYPE, "AssetID": str(film_id)}).get("Item") if film_id else None

    if not film:
        raise LookupError("Film not found")

    title, subtitle, link = parse_details(body)
    existing_laurels = film.get("laurelImages", [])
    kept_laurels = body.get("laurelImages", existing_laurels)

    if not isinstance(kept_laurels, list) or not set(kept_laurels) <= set(existing_laurels):
        raise InvalidRequest("Invalid laurel images")

    new_laurel_keys = parse_upload_keys(body.get("laurelKeys"), LAUREL_UPLOAD_PATTERN, "laurel images")

    if len(kept_laurels) + len(new_laurel_keys) > MAX_LAURELS:
        raise InvalidRequest(f"At most {MAX_LAURELS} laurel images are allowed")

    video_key = body.get("videoKey")

    if video_key is not None:
        if not isinstance(video_key, str) or not re.fullmatch(VIDEO_UPLOAD_PATTERN, video_key):
            raise InvalidRequest("Invalid video upload")

        require_upload(video_key)

    laurel_images = kept_laurels + [process_laurel(key) for key in new_laurel_keys]
    legacy_laurels = body.get("laurels", bool(film.get("laurels")))

    sets = ["#title = :title", "#subtitle = :subtitle", "#laurelImages = :laurelImages", "#laurels = :laurels"]
    removes = []
    names = {"#title": "title", "#subtitle": "subtitle", "#laurelImages": "laurelImages", "#laurels": "laurels"}
    values = {
        ":title": title,
        ":subtitle": subtitle,
        ":laurelImages": laurel_images,
        ":laurels": bool(legacy_laurels),
    }

    names["#link"] = "link"

    if link:
        sets.append("#link = :link")
        values[":link"] = link
    else:
        removes.append("#link")

    job = uuid.uuid4().hex

    if video_key:
        sets += ["#status = :processing", "#transcodeJob = :job"]
        removes.append("#statusMessage")
        names.update({"#status": "status", "#transcodeJob": "transcodeJob", "#statusMessage": "statusMessage"})
        values.update({":processing": "processing", ":job": job})

    expression = "SET " + ", ".join(sets) + (" REMOVE " + ", ".join(removes) if removes else "")

    updated = table.update_item(
        Key={"Type": FILM_TYPE, "AssetID": film["AssetID"]},
        UpdateExpression=expression,
        ConditionExpression="attribute_exists(AssetID)",
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
        ReturnValues="ALL_NEW",
    )["Attributes"]

    for key in set(existing_laurels) - set(kept_laurels):
        delete_owned_object(key, LAUREL_PREFIX)

    if video_key:
        start_transcode(film["AssetID"], video_key, job)

    return serialize(updated)


def reorder_films(body):
    ids = body.get("ids")
    films = query_type(table, FILM_TYPE)

    if not isinstance(ids, list) or len(ids) != len(set(ids)) or set(ids) != {film["AssetID"] for film in films}:
        raise InvalidRequest("Order must include every film exactly once")

    write_updates(dynamodb_client, [
        order_update(TABLE_NAME, FILM_TYPE, film_id, position) for position, film_id in enumerate(ids, 1)
    ])


def delete_film(body):
    film_id = body.get("id")
    film = table.get_item(Key={"Type": FILM_TYPE, "AssetID": str(film_id)}).get("Item") if film_id else None

    if not film:
        raise LookupError("Film not found")

    table.delete_item(Key={"Type": FILM_TYPE, "AssetID": film["AssetID"]})
    delete_owned_object(key_from_src(film.get("src")), VIDEO_PREFIX)

    for key in film.get("laurelImages", []):
        delete_owned_object(key, LAUREL_PREFIX)

    renumber(query_type(table, FILM_TYPE))


def handler(event, _):
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    method = event.get("httpMethod")

    if method == "GET":
        return build_response(200, [serialize(film) for film in by_order(query_type(table, FILM_TYPE))], origin)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    if not isinstance(body, dict):
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    try:
        if method == "POST":
            return build_response(201, create_film(body), origin)

        if method == "PATCH":
            return build_response(200, update_film(body), origin)

        if method == "PUT":
            reorder_films(body)
            return build_response(200, {"ok": True}, origin)

        if method == "DELETE":
            delete_film(body)
            return build_response(200, {"ok": True}, origin)
    except InvalidRequest as err:
        return build_response(400, {"error": str(err)}, origin)
    except LookupError as err:
        return build_response(404, {"error": str(err)}, origin)

    return build_response(405, {"error": f"Unsupported method: '{method}'"}, origin)
