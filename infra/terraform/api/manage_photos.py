import json
import os
from collections import defaultdict

import boto3

from common import (
    AssetType,
    build_response,
    by_order,
    get_asset_id,
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

PHOTO_KEY_PREFIX = "assets/images/photo/"

LEVEL_TYPES = {
    "collections": AssetType.PHOTO_COLLECTION.value,
    "folders": AssetType.PHOTO_FOLDER.value,
    "photos": AssetType.PHOTO.value,
}

PARENT_FIELDS = {"folders": "collection", "photos": "folder"}

PARENT_TYPES = {
    "folders": AssetType.PHOTO_COLLECTION.value,
    "photos": AssetType.PHOTO_FOLDER.value,
}

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
dynamodb_client = boto3.client("dynamodb")
s3 = boto3.client("s3")


def handler(event, _):
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    method = event.get("httpMethod")

    if method == "GET":
        folders_by_collection = defaultdict(list)
        photos_by_folder = defaultdict(list)

        for folder in query_type(table,AssetType.PHOTO_FOLDER.value):
            folders_by_collection[get_asset_id(folder.get("collection") or "")].append(folder)

        for photo in query_type(table,AssetType.PHOTO.value):
            photos_by_folder[get_asset_id(photo.get("folder") or "")].append(photo)

        library = [
            {
                "id": collection["AssetID"],
                "title": collection.get("title", collection["AssetID"]),
                "folders": [
                    {
                        "id": folder["AssetID"],
                        "title": folder.get("title", folder["AssetID"]),
                        "photos": [
                            {"id": photo["AssetID"], "src": src_url(photo.get("src"), CLOUDFRONT_DOMAIN)}
                            for photo in by_order(photos_by_folder[get_asset_id(folder["AssetID"])])
                        ],
                    }
                    for folder in by_order(folders_by_collection[get_asset_id(collection["AssetID"])])
                ],
            }
            for collection in by_order(query_type(table,AssetType.PHOTO_COLLECTION.value))
        ]

        return build_response(200, library, origin)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    if method == "PUT":
        changes = body.get("changes")

        if not isinstance(changes, list) or not changes or not all(isinstance(change, dict) for change in changes):
            return build_response(400, {"error": "changes must be a non-empty list"}, origin)

        for change in changes:
            if change.get("level") not in LEVEL_TYPES:
                return build_response(400, {"error": f"Invalid level: '{change.get('level')}'"}, origin)

            ids = change.get("ids")

            if not isinstance(ids, list) or not all(isinstance(asset_id, str) for asset_id in ids):
                return build_response(400, {"error": "ids must be a list of strings"}, origin)

        updates = []

        for level, asset_type in LEVEL_TYPES.items():
            level_changes = [change for change in changes if change["level"] == level]

            if not level_changes:
                continue

            items = query_type(table,asset_type)
            parent_field = PARENT_FIELDS.get(level)

            if parent_field:
                parent_ids = {
                    get_asset_id(parent["AssetID"]): parent["AssetID"]
                    for parent in query_type(table,PARENT_TYPES[level])
                }
                targets = [
                    (parent_ids.get(get_asset_id(str(change.get("parent") or ""))), change["ids"])
                    for change in level_changes
                ]

                if any(parent_id is None for parent_id, _ in targets):
                    return build_response(400, {"error": "Unknown destination"}, origin)

                parent_slugs = {get_asset_id(parent_id) for parent_id, _ in targets}

                if len(parent_slugs) != len(targets):
                    return build_response(400, {"error": "Each destination may only appear once"}, origin)

                items = [item for item in items if get_asset_id(item.get(parent_field) or "") in parent_slugs]
            elif len(level_changes) > 1:
                return build_response(400, {"error": "Collections may only be ordered once"}, origin)
            else:
                targets = [(None, level_changes[0]["ids"])]

            requested = [asset_id for _, ids in targets for asset_id in ids]

            if len(requested) != len(set(requested)) or set(requested) != {item["AssetID"] for item in items}:
                return build_response(400, {"error": "Changes must include every affected item exactly once"}, origin)

            for parent_id, ids in targets:
                updates.extend(
                    order_update(TABLE_NAME, asset_type, asset_id, position, parent_field, parent_id)
                    for position, asset_id in enumerate(ids, 1)
                )

        write_updates(dynamodb_client, updates)

        return build_response(200, {"ok": True}, origin)

    if method == "DELETE":
        photo_id = body.get("id")

        if not isinstance(photo_id, str) or not photo_id:
            return build_response(400, {"error": "Missing id"}, origin)

        photo = table.get_item(Key={"Type": AssetType.PHOTO.value, "AssetID": photo_id}).get("Item")

        if not photo:
            return build_response(404, {"error": "Photo not found"}, origin)

        src = photo.get("src") or ""
        key = key_from_src(src)

        if key.startswith(PHOTO_KEY_PREFIX) and ".." not in key:
            s3.delete_object(Bucket=BUCKET_NAME, Key=key)

        table.delete_item(Key={"Type": AssetType.PHOTO.value, "AssetID": photo_id})

        folder_id = get_asset_id(photo.get("folder") or "")
        remaining = [
            item for item in query_type(table,AssetType.PHOTO.value)
            if get_asset_id(item.get("folder") or "") == folder_id
        ]
        write_updates(dynamodb_client, [
            order_update(TABLE_NAME, AssetType.PHOTO.value, item["AssetID"], position)
            for position, item in enumerate(by_order(remaining), 1)
        ])

        return build_response(200, {"ok": True}, origin)

    return build_response(405, {"error": f"Unsupported method: '{method}'"}, origin)
