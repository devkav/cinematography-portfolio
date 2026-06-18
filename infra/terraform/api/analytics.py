import json
import os
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

import boto3


TABLE_NAME = os.getenv("ANALYTICS_TABLE_NAME", "analytics_db")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://maggieclucy.com",
    "https://www.maggieclucy.com"
]

MAX_SESSION_LENGTH = 128
MAX_PAGE_LENGTH = 256
MAX_VIEW_ID_LENGTH = 64
MAX_ENTERED_AT_LENGTH = 40
MAX_DURATION_SECONDS = 24 * 60 * 60

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


def clean_duration(value):
    try:
        duration = int(value)
    except (TypeError, ValueError):
        return None

    if 0 <= duration <= MAX_DURATION_SECONDS:
        return duration

    return None


def handler(event, _):
    headers = event.get("headers") or {}
    headers_lower = {key.lower(): value for key, value in headers.items()}

    origin = headers_lower.get("origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    session_id = body.get("sessionId")
    page = body.get("page")

    if not session_id or not page:
        return build_response(400, {"error": "Missing sessionId or page"}, origin)

    view_id = body.get("viewId")
    entered_at = body.get("enteredAt")

    if view_id and entered_at:
        timestamp = f"{str(entered_at)[:MAX_ENTERED_AT_LENGTH]}#{str(view_id)[:MAX_VIEW_ID_LENGTH]}"
    else:
        timestamp = f"{datetime.now(timezone.utc).isoformat()}#{uuid.uuid4().hex[:8]}"

    item = {
        "SessionID": str(session_id)[:MAX_SESSION_LENGTH],
        "Timestamp": timestamp,
        "page": str(page)[:MAX_PAGE_LENGTH],
        "country": headers_lower.get("cloudfront-viewer-country"),
        "region": headers_lower.get("cloudfront-viewer-country-region"),
        "regionName": headers_lower.get("cloudfront-viewer-country-region-name"),
        "city": headers_lower.get("cloudfront-viewer-city"),
        "latitude": headers_lower.get("cloudfront-viewer-latitude"),
        "longitude": headers_lower.get("cloudfront-viewer-longitude"),
        "userAgent": headers_lower.get("user-agent"),
    }

    duration_seconds = clean_duration(body.get("durationSeconds"))
    if duration_seconds is not None:
        item["durationSeconds"] = duration_seconds

    item = {key: value for key, value in item.items() if value is not None}

    table.put_item(Item=item)

    return build_response(200, {"ok": True}, origin)
