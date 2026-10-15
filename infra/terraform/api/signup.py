import json
import os
import re
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from common import build_response, is_allowed_origin


TABLE_NAME = os.getenv("MAILING_LIST_TABLE_NAME", "mailing_list_db")

VALID_PROJECTS = {"adrenaline-rush"}

MAX_EMAIL_LENGTH = 254
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

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

    # Hidden form field that only bots fill in. Pretend it worked so they don't retry.
    if body.get("website"):
        return build_response(200, {"ok": True}, origin)

    project = body.get("project")
    email = str(body.get("email") or "").strip().lower()

    if project not in VALID_PROJECTS:
        return build_response(400, {"error": f"Project '{project}' is not a valid project"}, origin)

    if len(email) > MAX_EMAIL_LENGTH or not EMAIL_PATTERN.match(email):
        return build_response(400, {"error": "Invalid email address"}, origin)

    try:
        table.put_item(
            Item={
                "ProjectID": project,
                "Email": email,
                "SubscribedAt": datetime.now(timezone.utc).isoformat(),
            },
            ConditionExpression="attribute_not_exists(Email)",
        )
    except ClientError as error:
        # Already signed up. Keep the original signup time and report success.
        if error.response["Error"]["Code"] != "ConditionalCheckFailedException":
            raise

    return build_response(200, {"ok": True}, origin)
