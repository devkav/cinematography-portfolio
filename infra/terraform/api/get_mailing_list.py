import os
from collections import defaultdict

import boto3

from common import build_response, is_allowed_origin


TABLE_NAME = os.getenv("MAILING_LIST_TABLE_NAME", "mailing_list_db")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def scan_all():
    items = []
    kwargs = {}

    while True:
        response = table.scan(**kwargs)
        items.extend(response.get("Items", []))

        if "LastEvaluatedKey" not in response:
            return items

        kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def handler(event, _):
    headers = event.get("headers") or {}
    headers_lower = {key.lower(): value for key, value in headers.items()}
    origin = headers_lower.get("origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    signups_by_project = defaultdict(list)

    for item in scan_all():
        signups_by_project[item["ProjectID"]].append({
            "email": item["Email"],
            "subscribedAt": item.get("SubscribedAt"),
        })

    projects = [
        {
            "project": project,
            "signups": sorted(signups, key=lambda signup: signup["subscribedAt"] or "", reverse=True),
        }
        for project, signups in sorted(signups_by_project.items())
    ]

    return build_response(200, {"projects": projects}, origin)
