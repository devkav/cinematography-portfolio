from config.aws import TERRAFORM_ENV_BUCKET_NAME
from util.aws import clear_bucket, upload_directory_to_bucket


def main():
    clear_bucket(TERRAFORM_ENV_BUCKET_NAME)
    upload_directory_to_bucket(TERRAFORM_ENV_BUCKET_NAME, "infra/terraform")
    print("\nSuccess")


if __name__ == "__main__":
    main()
