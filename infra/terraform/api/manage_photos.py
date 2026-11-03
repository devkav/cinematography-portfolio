import json
import os
from collections import defaultdict
from decimal import Decimal

import boto3

from common import (
    LAYOUT_ID,
    AssetType,
    build_response,
    by_order,
    get_asset_id,
    get_layout,
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
S3_DELETE_LIMIT = 1000

LAYOUT_MIN_WIDTH = 10
LAYOUT_MAX_GAP = 20
LAYOUT_MAX_FLEX = 12
LAYOUT_SIZINGS = {"flex", "width", "height"}
LAYOUT_MIN_RATIO = 0.05
LAYOUT_MAX_RATIO = 20

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


def is_int_between(value, low, high):
    return isinstance(value, int) and not isinstance(value, bool) and low <= value <= high


def handler(event, _):
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    method = event.get("httpMethod")

    if method == "GET":
        folders_by_collection = defaultdict(list)
        photos_by_folder = defaultdict(list)
        photos = query_type(table, AssetType.PHOTO.value)

        for folder in query_type(table,AssetType.PHOTO_FOLDER.value):
            folders_by_collection[get_asset_id(folder.get("collection") or "")].append(folder)

        for photo in photos:
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

        layout = get_layout(table, {photo["AssetID"] for photo in photos})

        return build_response(200, {"collections": library, "layout": layout}, origin)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    if method == "PUT" and "layout" in body:
        rows = body["layout"]

        if not isinstance(rows, list) or not all(
            isinstance(row, dict) and isinstance(row.get("cells"), list) and row["cells"] for row in rows
        ):
            return build_response(400, {"error": "layout must be a list of rows with at least one photo"}, origin)

        photo_ids = {photo["AssetID"] for photo in query_type(table, AssetType.PHOTO.value)}

        for row in rows:
            if not is_int_between(row.get("width"), LAYOUT_MIN_WIDTH, 100):
                return build_response(400, {"error": f"Row width must be between {LAYOUT_MIN_WIDTH}% and 100%"}, origin)

            if not is_int_between(row.get("space"), 0, LAYOUT_MAX_GAP):
                return build_response(400, {"error": f"Space above must be between 0% and {LAYOUT_MAX_GAP}%"}, origin)

            if not is_int_between(row.get("gap"), 0, LAYOUT_MAX_GAP):
                return build_response(400, {"error": f"Row spacing must be between 0% and {LAYOUT_MAX_GAP}%"}, origin)

            if row.get("sizing") not in LAYOUT_SIZINGS:
                return build_response(400, {"error": f"Row sizing must be one of {sorted(LAYOUT_SIZINGS)}"}, origin)

            for cell in row["cells"]:
                if not isinstance(cell, dict) or not isinstance(cell.get("photo"), str):
                    return build_response(400, {"error": "Each cell must reference a photo"}, origin)

                if cell["photo"] not in photo_ids:
                    return build_response(400, {"error": f"Unknown photo: '{cell['photo']}'"}, origin)

                if not is_int_between(cell.get("flex"), 1, LAYOUT_MAX_FLEX):
                    return build_response(400, {"error": f"Flex must be between 1 and {LAYOUT_MAX_FLEX}"}, origin)

                ratio = cell.get("ratio")

                if (
                    isinstance(ratio, bool)
                    or not isinstance(ratio, (int, float))
                    or not LAYOUT_MIN_RATIO <= ratio <= LAYOUT_MAX_RATIO
                ):
                    return build_response(
                        400, {"error": f"Ratio must be between {LAYOUT_MIN_RATIO} and {LAYOUT_MAX_RATIO}"}, origin
                    )

        table.put_item(Item={
            "Type": AssetType.PHOTO_LAYOUT.value,
            "AssetID": LAYOUT_ID,
            "rows": [
                {
                    "width": row["width"],
                    "gap": row["gap"],
                    "space": row["space"],
                    "sizing": row["sizing"],
                    "cells": [
                        {"photo": cell["photo"], "flex": cell["flex"], "ratio": Decimal(str(round(cell["ratio"], 4)))}
                        for cell in row["cells"]
                    ],
                }
                for row in rows
            ],
        })

        return build_response(200, {"ok": True}, origin)

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
        level = body.get("level", "photos")
        asset_id = body.get("id")

        if level not in LEVEL_TYPES:
            return build_response(400, {"error": f"Invalid level: '{level}'"}, origin)

        if not isinstance(asset_id, str) or not asset_id:
            return build_response(400, {"error": "Missing id"}, origin)

        asset_type = LEVEL_TYPES[level]
        item = table.get_item(Key={"Type": asset_type, "AssetID": asset_id}).get("Item")

        if not item:
            return build_response(404, {"error": f"{level[:-1].capitalize()} not found"}, origin)

        if level == "photos":
            folders = []
            photos = [item]
        else:
            folders = [item] if level == "folders" else [
                folder for folder in query_type(table, AssetType.PHOTO_FOLDER.value)
                if get_asset_id(folder.get("collection") or "") == get_asset_id(asset_id)
            ]
            folder_ids = {get_asset_id(folder["AssetID"]) for folder in folders}
            photos = [
                photo for photo in query_type(table, AssetType.PHOTO.value)
                if get_asset_id(photo.get("folder") or "") in folder_ids
            ]

        deleted = (
            [(AssetType.PHOTO.value, photo["AssetID"]) for photo in photos]
            + [(AssetType.PHOTO_FOLDER.value, folder["AssetID"]) for folder in folders]
            + ([(asset_type, asset_id)] if level == "collections" else [])
        )
        write_updates(dynamodb_client, [
            {
                "Delete": {
                    "TableName": TABLE_NAME,
                    "Key": {"Type": {"S": deleted_type}, "AssetID": {"S": deleted_id}},
                }
            }
            for deleted_type, deleted_id in deleted
        ])

        keys = [key_from_src(photo.get("src") or "") for photo in photos]
        keys = [key for key in keys if key.startswith(PHOTO_KEY_PREFIX) and ".." not in key]

        for start in range(0, len(keys), S3_DELETE_LIMIT):
            s3.delete_objects(
                Bucket=BUCKET_NAME,
                Delete={"Objects": [{"Key": key} for key in keys[start:start + S3_DELETE_LIMIT]], "Quiet": True},
            )

        parent_field = PARENT_FIELDS.get(level)
        parent_id = get_asset_id(item.get(parent_field) or "") if parent_field else None
        siblings = [
            sibling for sibling in query_type(table, asset_type)
            if not parent_field or get_asset_id(sibling.get(parent_field) or "") == parent_id
        ]
        write_updates(dynamodb_client, [
            order_update(TABLE_NAME, asset_type, sibling["AssetID"], position)
            for position, sibling in enumerate(by_order(siblings), 1)
        ])

        return build_response(200, {"ok": True}, origin)

    return build_response(405, {"error": f"Unsupported method: '{method}'"}, origin)
