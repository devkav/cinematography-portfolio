from config.aws import ASSETS_BUCKET_NAME 
from util.aws import clear_bucket, upload_directory_to_bucket


def main():
    clear_bucket(ASSETS_BUCKET_NAME)
    upload_directory_to_bucket(ASSETS_BUCKET_NAME, "frontend/app/assets")
    print("\nSuccess")


if __name__ == "__main__":
    main()
