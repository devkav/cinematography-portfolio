from pathlib import Path
from config.aws import ASSETS_BUCKET_NAME 
from util.aws import delete_bucket_objects, upload_directory_to_bucket


def main():
    # TODO: Should be updated to only replace updated files
    delete_bucket_objects(ASSETS_BUCKET_NAME)
    upload_directory_to_bucket(
        ASSETS_BUCKET_NAME,
        "frontend/app/assets",
        exclude_condition = lambda file_path: Path(file_path).suffix == ".ts"
    )
    print("\nSuccess")


if __name__ == "__main__":
    main()
