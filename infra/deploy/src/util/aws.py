import os
import boto3
import glob
from pathlib import Path
from util.output import print_colored_message, FAIL, WARNING, OK
from util.io import remove_root_from_path, get_mime_type


s3 = boto3.resource('s3')


def get_file_path_to_s3_key(directory: str):
    """
    Converts all files in a given directory and its subdirectories to paths/keys in an
    s3 bucket.
    """
    root_directory = Path(__file__).parent.parent.parent.parent.parent
    upload_directory = root_directory.joinpath(directory)
    upload_directory_str = str(upload_directory)
    file_paths = glob.glob(f"{upload_directory_str}/**", recursive=True)
    file_path_to_key = {}

    for file_path_str in file_paths:
        if Path(file_path_str).is_file():
            file_key = remove_root_from_path(file_path_str, upload_directory_str)
            file_path_to_key[file_path_str] = file_key

    return file_path_to_key


def delete_bucket_objects(bucket_name: str, condition = lambda _: True):
    bucket = s3.Bucket(bucket_name)
    deleted_object_names = []
    ignored_object_names = []
    print(f"\nDeleting objects in {bucket_name}...")

    for s3_object in bucket.objects.all():
        object_name = s3_object.key

        if condition(s3_object):
            print_colored_message(f"Deleting {object_name}", FAIL)
            s3.Object(bucket.name, object_name).delete()
            deleted_object_names.append(object_name)
        else:
            print_colored_message(f"Ignoring {object_name}; no changes.", WARNING)
            ignored_object_names.append(object_name)

    return deleted_object_names, ignored_object_names


def upload_directory_to_bucket(bucket_name: str, directory: str, exclude_condition = lambda _: False):
    uploaded_object_names = []
    file_path_to_key = get_file_path_to_s3_key(directory)
    print(f"\nUploading new files to {bucket_name}...")

    for file_path_str, file_key in file_path_to_key.items():
        if exclude_condition(file_key):
            continue

        mime_type = get_mime_type(file_path_str)
        print_colored_message(f"Uploading {file_key}", OK)

        s3.meta.client.upload_file(file_path_str, bucket_name, file_key, ExtraArgs={'ContentType': mime_type})
        uploaded_object_names.append(file_key)

    return uploaded_object_names


def download_bucket_contents(bucket_name: str, download_directory: str):
    bucket = s3.Bucket(bucket_name)
    print(f"\nDownloading the contents of {bucket_name} to {download_directory}...")

    for s3_object in bucket.objects.all():
        print_colored_message(f"Downloading {s3_object.key}", OK)
        downloaded_file_path = Path(download_directory).joinpath(s3_object.key)
        os.makedirs(str(downloaded_file_path.parent), exist_ok=True)

        bucket.download_file(s3_object.key, str(downloaded_file_path))
