import math
import os
import boto3
from common import build_response, is_allowed_origin


TABLE_NAME = os.getenv("ANALYTICS_TABLE_NAME", "analytics_db")
PAGE_SIZE = 20
GEO_FIELDS = ("country", "region", "regionName", "city", "latitude", "longitude", "userAgent")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def handler(event, _):
    headers = event.get("headers") or {}
    headers_lower = {key.lower(): value for key, value in headers.items()}
    origin = headers_lower.get("origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    params = event.get("queryStringParameters") or {}

    try:
        page = max(int(params.get("page")), 1)
    except (TypeError, ValueError):
        page = 1

    grouped = {}
    kwargs = {}

    while True:
        response = table.scan(**kwargs)

        for item in response.get("Items", []):
            grouped.setdefault(item.get("SessionID"), []).append(item)

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break

        kwargs["ExclusiveStartKey"] = last_key

    sessions = []

    for session_id, views in grouped.items():
        views.sort(key=lambda view: view.get("Timestamp", ""))

        actions = []
        for view in views:
            timestamp = view.get("Timestamp")
            action = {
                "page": view.get("page"),
                "timestamp": timestamp.split("#", 1)[0] if timestamp else timestamp,
                "durationSeconds": view.get("durationSeconds")
            }

            actions.append(action)

        first = views[0]
        session = {"sessionId": session_id}
        session.update({field: first[field] for field in GEO_FIELDS if first.get(field) is not None})
        session["actions"] = actions
        sessions.append(session)

    sessions.sort(key=lambda session: session["actions"][-1]["timestamp"], reverse=True)

    start = (page - 1) * PAGE_SIZE

    body = {
        "sessions": sessions[start:start + PAGE_SIZE],
        "page": page,
        "totalPages": math.ceil(len(sessions) / PAGE_SIZE),
    }

    return build_response(200, body, origin)
