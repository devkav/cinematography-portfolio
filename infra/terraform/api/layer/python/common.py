import re
import json
from decimal import Decimal
from urllib.parse import urlparse
from enum import Enum

from boto3.dynamodb.conditions import Key


TRANSACTION_LIMIT = 100

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://maggieclucy.com",
    "https://www.maggieclucy.com"
]


class Page(str, Enum):
    PHOTO = "photo"
    FILM = "film"
    RESUME = "resume"


class AssetType(str, Enum):
    PHOTO_FOLDER = "photo_folder"
    PHOTO_COLLECTION = "photo_collection"
    PHOTO = "photo"
    FILM = "film"


def get_asset_id(title):
    title = title.lower().strip()
    title = re.sub(r"[^\w\s-]", "", title)
    title = re.sub(r"[\s_]+", "-", title)
    title = re.sub(r"-+", "-", title)
    return title


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)

        return super().default(obj)


def build_response(status_code, body, origin):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin or ""
        },
        "body": json.dumps(body, cls=DecimalEncoder)
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


def query_type(table, asset_type):
    items = []
    kwargs = {"KeyConditionExpression": Key("Type").eq(asset_type)}

    while True:
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))

        if "LastEvaluatedKey" not in response:
            return items

        kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def by_order(items):
    return sorted(items, key=lambda item: item.get("order", 0))


def src_url(src, domain):
    if not src or src.startswith("http"):
        return src

    return f"https://{domain}/{src}"


def key_from_src(src):
    if not src:
        return ""

    return urlparse(src).path.lstrip("/") if src.startswith("http") else src


def order_update(table_name, asset_type, asset_id, position, parent_field=None, parent_id=None):
    expression = "SET #order = :order"
    names = {"#order": "order"}
    values = {":order": {"N": str(position)}}

    if parent_field:
        expression += ", #parent = :parent"
        names["#parent"] = parent_field
        values[":parent"] = {"S": parent_id}

    return {
        "Update": {
            "TableName": table_name,
            "Key": {"Type": {"S": asset_type}, "AssetID": {"S": asset_id}},
            "UpdateExpression": expression,
            "ConditionExpression": "attribute_exists(AssetID)",
            "ExpressionAttributeNames": names,
            "ExpressionAttributeValues": values,
        }
    }


def write_updates(client, updates):
    for start in range(0, len(updates), TRANSACTION_LIMIT):
        client.transact_write_items(TransactItems=updates[start:start + TRANSACTION_LIMIT])


