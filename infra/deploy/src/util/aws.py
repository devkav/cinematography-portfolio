import boto3
import glob
from pathlib import Path
from util.output import print_colored_message, FAIL, OK
from util.io import remove_root_from_path, get_mime_type


def clear_bucket(bucket_name):
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    print(f"Deleting exiting objects in {bucket_name}...")

    for s3_object in bucket.objects.all():
        print_colored_message(f"Deleting {s3_object.key}", FAIL)
        s3.Object(bucket.name, s3_object.key).delete()


def upload_directory_to_bucket(bucket_name, directory):
    s3 = boto3.resource('s3')
    root_directory = Path(__file__).parent.parent.parent.parent.parent
    upload_directory = root_directory.joinpath(directory)
    upload_directory_str = str(upload_directory)

    file_paths = glob.glob(f"{upload_directory_str}/**", recursive=True)
    print(f"\nUploading new files to {bucket_name}...")

    for file_path_str in file_paths:
        file_path = Path(file_path_str)

        if not file_path.is_file():
            continue

        file_key = remove_root_from_path(file_path_str, str(upload_directory_str))
        mime_type = get_mime_type(file_path_str)
        print_colored_message(f"Uploading {file_key}", OK)

        s3.meta.client.upload_file(file_path, bucket_name, file_key, ExtraArgs={'ContentType': mime_type})
