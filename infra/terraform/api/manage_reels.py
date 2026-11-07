import json
import os
import re
from urllib.parse import parse_qs, urlparse

import boto3

from common import AssetType, REEL_LIST_ID, build_response, get_reels, is_allowed_origin


TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")

MAX_REELS = 20
VIDEO_ID_PATTERN = re.compile(r"[A-Za-z0-9_-]{11}")
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


class InvalidRequest(Exception):
    pass


def youtube_video_id(link):
    url = urlparse(str(link).strip())

    if url.scheme not in ("http", "https") or url.hostname not in YOUTUBE_HOSTS:
        return None

    if url.hostname == "youtu.be":
        candidate = url.path.strip("/")
    elif url.path == "/watch":
        candidate = parse_qs(url.query).get("v", [""])[0]
    else:
        match = re.fullmatch(r"/(?:embed|shorts|live)/([^/]+)/?", url.path)
        candidate = match.group(1) if match else ""

    return candidate if VIDEO_ID_PATTERN.fullmatch(candidate) else None


def save_reels(body):
    links = body.get("links")

    if not isinstance(links, list) or len(links) > MAX_REELS:
        raise InvalidRequest(f"Send a list of at most {MAX_REELS} links")

    video_ids = []

    for link in links:
        video_id = youtube_video_id(link)

        if not video_id:
            raise InvalidRequest(f"Not a YouTube video link: '{link}'")

        if video_id in video_ids:
            raise InvalidRequest(f"This reel is listed twice: '{link}'")

        video_ids.append(video_id)

    table.put_item(Item={"Type": AssetType.REEL_LIST.value, "AssetID": REEL_LIST_ID, "videos": video_ids})


def handler(event, _):
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    method = event.get("httpMethod")

    if method == "GET":
        return build_response(200, get_reels(table), origin)

    if method != "PUT":
        return build_response(405, {"error": f"Unsupported method: '{method}'"}, origin)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    if not isinstance(body, dict):
        return build_response(400, {"error": "Invalid JSON body"}, origin)

    try:
        save_reels(body)
    except InvalidRequest as err:
        return build_response(400, {"error": str(err)}, origin)

    return build_response(200, get_reels(table), origin)
