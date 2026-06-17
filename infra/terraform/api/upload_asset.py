import json
import os
from urllib.parse import urlparse

import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://maggieclucy.com",
    "https://www.maggieclucy.com"
]

VALID_PAGES = {"photo", "film"}

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def build_response(status_code, body, origin):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin or ""
        },
        "body": json.dumps(body)
    }


def is_allowed_origin(origin):
    if not origin:
        return False

    origin_parsed = urlparse(origin)

    return any(
        urlparse(allowed).netloc == origin_parsed.netloc and
        urlparse(allowed).scheme == origin_parsed.scheme
        for allowed in ALLOWED_ORIGINS
    )


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

    # TODO: write asset metadata to DynamoDB

    if page == "photo":
        collections_response = table.query(KeyConditionExpression=Key("Type").eq("photo_collection"))
        collection = body.get("collection")
        folder = body.get("folder")


    return build_response(200, {"ok": True}, origin)
