import os
import subprocess
import uuid

import boto3
from botocore.exceptions import ClientError

from common import AssetType, key_from_src


TABLE_NAME = os.getenv("ASSETS_TABLE_NAME", "assets_db")
BUCKET_NAME = os.getenv("ASSETS_BUCKET_NAME")
FFMPEG_PATH = os.getenv("FFMPEG_PATH", "/opt/bin/ffmpeg")
WORK_DIR = os.getenv("WORK_DIR", "/tmp")

VIDEO_PREFIX = "assets/videos/"
IMMUTABLE_CACHE_CONTROL = "max-age=31536000, immutable"
FFMPEG_TIMEOUT_SECONDS = 840
MAX_STATUS_MESSAGE_LENGTH = 300

ENCODE_ARGS = [
    "-map", "0:v:0",
    "-an", "-sn", "-dn",
    "-vf", (
        "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:flags=lanczos,"
        "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p"
    ),
    "-fpsmax", "30",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "22",
    "-profile:v", "main",
    "-level:v", "4.0",
    "-maxrate", "20M",
    "-bufsize", "25M",
    "-x264-params", "keyint=240:min-keyint=24",
    "-movflags", "+faststart",
]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
s3 = boto3.client("s3")


def is_condition_failure(err):
    return err.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException"


def handler(event, _):
    film_id = event["id"]
    source_key = event["sourceKey"]
    job = event["job"]
    key = {"Type": AssetType.FILM.value, "AssetID": film_id}

    source_path = os.path.join(WORK_DIR, f"{uuid.uuid4()}{os.path.splitext(source_key)[1]}")
    output_path = os.path.join(WORK_DIR, f"{uuid.uuid4()}.mp4")

    try:
        s3.download_file(BUCKET_NAME, source_key, source_path)

        result = subprocess.run(
            [FFMPEG_PATH, "-hide_banner", "-loglevel", "error", "-y", "-i", source_path, *ENCODE_ARGS, output_path],
            capture_output=True,
            text=True,
            timeout=FFMPEG_TIMEOUT_SECONDS,
        )

        if result.returncode != 0:
            errors = [line for line in result.stderr.strip().splitlines() if line.strip()]
            raise RuntimeError(
                errors[-1].replace(source_path, "The uploaded video") if errors else "The video could not be encoded"
            )

        output_key = f"{VIDEO_PREFIX}{film_id}-{uuid.uuid4().hex[:8]}.mp4"
        s3.upload_file(
            output_path,
            BUCKET_NAME,
            output_key,
            ExtraArgs={"ContentType": "video/mp4", "CacheControl": IMMUTABLE_CACHE_CONTROL},
        )

        try:
            previous = table.update_item(
                Key=key,
                UpdateExpression="SET #src = :src, #status = :ready REMOVE #statusMessage, #transcodeJob",
                ConditionExpression="#transcodeJob = :job",
                ExpressionAttributeNames={
                    "#src": "src",
                    "#status": "status",
                    "#statusMessage": "statusMessage",
                    "#transcodeJob": "transcodeJob",
                },
                ExpressionAttributeValues={":src": output_key, ":ready": "ready", ":job": job},
                ReturnValues="UPDATED_OLD",
            ).get("Attributes", {})
        except ClientError as err:
            if is_condition_failure(err):
                s3.delete_object(Bucket=BUCKET_NAME, Key=output_key)
                return {"status": "superseded"}

            raise

        previous_key = key_from_src(previous.get("src"))

        if previous_key.startswith(VIDEO_PREFIX) and previous_key != output_key and ".." not in previous_key:
            s3.delete_object(Bucket=BUCKET_NAME, Key=previous_key)

        return {"status": "ready", "src": output_key}
    except Exception as err:
        message = str(err) if isinstance(err, RuntimeError) else "The video could not be processed"

        try:
            table.update_item(
                Key=key,
                UpdateExpression="SET #status = :failed, #statusMessage = :message REMOVE #transcodeJob",
                ConditionExpression="#transcodeJob = :job",
                ExpressionAttributeNames={
                    "#status": "status",
                    "#statusMessage": "statusMessage",
                    "#transcodeJob": "transcodeJob",
                },
                ExpressionAttributeValues={
                    ":failed": "failed",
                    ":message": message[:MAX_STATUS_MESSAGE_LENGTH],
                    ":job": job,
                },
            )
        except ClientError as update_err:
            if not is_condition_failure(update_err):
                raise

        return {"status": "failed", "error": message}
    finally:
        try:
            s3.delete_object(Bucket=BUCKET_NAME, Key=source_key)
        except ClientError:
            pass

        for path in (source_path, output_path):
            if os.path.exists(path):
                os.remove(path)
