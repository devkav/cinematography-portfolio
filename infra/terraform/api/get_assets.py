import os
from collections import defaultdict

import boto3
from boto3.dynamodb.conditions import Key

from common import build_response, is_allowed_origin


TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")
CLOUDFRONT_DOMAIN = os.getenv("ASSETS_CLOUDFRONT_DOMAIN")

VALID_PAGES = {"film", "photo"}

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def build_src(key):
    if not key:
        return None

    return f"https://{CLOUDFRONT_DOMAIN}/{key}"


def handler(event, _):
    params = event.get("queryStringParameters", {})
    headers = event.get("headers", {})

    page = params.get("page")
    origin = headers.get("origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    if not page:
        return build_response(400, {"error": "Must specify page"}, origin)

    if page not in VALID_PAGES:
        return build_response(400, {"error": f"Page '{page}' is not a valid page"}, origin)

    if page == "film":
        response = table.query(KeyConditionExpression=Key("Type").eq("film"))
        items = sorted(response["Items"], key=lambda x: x.get("order", 0))

        assets = []
        for item in items:
            asset = {
                "id": item.get("order"),
                "title": item.get("title"),
                "subtitle": item.get("subtitle"),
                "src": build_src(item.get("src")),
            }

            if "link" in item:
                asset["link"] = item["link"]

            if item.get("laurels"):
                asset["laurels"] = True

            assets.append(asset)

        return build_response(200, assets, origin)

    collections_response = table.query(KeyConditionExpression=Key("Type").eq("photo_collection"))
    folders_response = table.query(KeyConditionExpression=Key("Type").eq("photo_folder"))
    photos_response = table.query(KeyConditionExpression=Key("Type").eq("photo"))

    collection_order = {
        item["AssetID"]: item.get("order", 0)
        for item in collections_response["Items"]
    }

    folders_by_id = {}
    for item in folders_response["Items"]:
        folders_by_id[item["AssetID"]] = {
            "title": item.get("title"),
            "collection": item.get("collection"),
            "order": item.get("order", 0),
        }

    photos_by_folder = defaultdict(list)
    for item in photos_response["Items"]:
        photos_by_folder[item.get("folder")].append(item)

    assets = []
    for folder_id, folder_info in folders_by_id.items():
        sorted_photos = sorted(photos_by_folder.get(folder_id, []), key=lambda x: x.get("order", 0))

        assets.append({
            "title": folder_info["title"],
            "collection": folder_info["collection"],
            "order": folder_info["order"],
            "collection_order": collection_order.get(folder_info["collection"], 0),
            "photos": [{"src": build_src(photo.get("src"))} for photo in sorted_photos],
        })

    assets.sort(key=lambda x: (x["collection_order"], x["order"]))

    for asset in assets:
        del asset["collection_order"]
        del asset["order"]

    return build_response(200, assets, origin)
