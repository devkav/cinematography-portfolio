import json
import os
import uuid

import boto3

from common import build_response, is_allowed_origin


BUCKET_NAME = os.getenv("ASSETS_BUCKET_NAME")
URL_EXPIRATION_SECONDS = 300

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
ALLOWED_CONTENT_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

VALID_KINDS = {"photo", "film"}

EXTENSION_BY_CONTENT_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
}

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
    content_type = body.get("contentType")

    if page not in VALID_KINDS:
        return build_response(400, {"error": f"Invalid page: '{page}'"}, origin)

    if content_type not in ALLOWED_CONTENT_TYPES:
        return build_response(400, {"error": f"Unsupported content type: '{content_type}'"}, origin)

    extension = EXTENSION_BY_CONTENT_TYPE[content_type]

    if page == "photo":
        folder = body.get("folder")
        file_name = f"{uuid.uuid4()}.{extension}"
        key = f"assets/images/photo/{folder}/{file_name}"

        url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type
            },
            ExpiresIn=URL_EXPIRATION_SECONDS
        )

        return build_response(200, {"url": url, "key": file_name}, origin)
