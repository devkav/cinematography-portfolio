import re
import json
from decimal import Decimal
from urllib.parse import urlparse
from enum import Enum


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://maggieclucy.com",
    "https://www.maggieclucy.com"
]


class Page(str, Enum):
    PHOTO = "photo"
    FILM = "film"


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



