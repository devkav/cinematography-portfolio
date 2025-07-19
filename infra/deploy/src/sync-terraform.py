import boto3
import glob
from pathlib import Path
from util.util import print_colored_message, remove_root_from_path, get_mime_type, FAIL, OK


BUCKET_NAME = "dkavalchek-terraform"


def main():
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(BUCKET_NAME)
    print("Deleting exiting objects...")

    for s3_object in bucket.objects.all():
        print_colored_message(f"Deleting {s3_object.key}", FAIL)
        s3.Object(bucket.name, s3_object.key).delete()

    root_directory = Path(__file__).parent.parent.parent.parent
    terraform_directory = root_directory.joinpath("infra/terraform")
    terraform_directory_str = str(terraform_directory)

    file_paths = glob.glob(f"{terraform_directory_str}/**", recursive=True)
    print("\nUploading new files...")

    for file_path_str in file_paths:
        file_path = Path(file_path_str)

        if not file_path.is_file():
            continue

        file_key = remove_root_from_path(file_path_str, str(terraform_directory_str))
        mime_type = get_mime_type(file_path_str)
        print_colored_message(f"Uploading {file_key}", OK)

        s3.meta.client.upload_file(file_path, BUCKET_NAME, file_key, ExtraArgs={'ContentType': mime_type})

    print("\nSuccess")


if __name__ == "__main__":
    main()
