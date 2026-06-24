import json
import os
import uuid
from datetime import datetime, timezone

import boto3

from common import build_response, is_allowed_origin


TABLE_NAME = os.getenv("ANALYTICS_TABLE_NAME", "analytics_db")

MAX_SESSION_LENGTH = 128
MAX_PAGE_LENGTH = 256
MAX_VIEW_ID_LENGTH = 64
MAX_ENTERED_AT_LENGTH = 40
MAX_DURATION_SECONDS = 24 * 60 * 60

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


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

    try:
        duration_seconds = int(body.get("durationSeconds"))
    except (TypeError, ValueError):
        duration_seconds = None

    if duration_seconds is not None and 0 <= duration_seconds <= MAX_DURATION_SECONDS:
        item["durationSeconds"] = duration_seconds

    item = {key: value for key, value in item.items() if value is not None}

    table.put_item(Item=item)

    return build_response(200, {"ok": True}, origin)
