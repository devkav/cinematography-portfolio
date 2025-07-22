from config.aws import ASSETS_BUCKET_NAME
from util.aws import download_bucket_contents


def main():
    download_bucket_contents(ASSETS_BUCKET_NAME, "frontend/app/assets/")
    print("\nSuccess")


if __name__ == "__main__":
    main()
