import boto3
import re
import datetime
from util.output import print_colored_message, FAIL, WARNING, OK
from util.aws import delete_bucket_objects, upload_directory_to_bucket, get_file_path_to_s3_key


BUILD_DIRECTORY_STR = "frontend/build/client"


def main():
    s3 = boto3.resource('s3')
    bucket_name = None

    for current_bucket in s3.buckets.all():
        if re.match(r'^terraform', current_bucket.name) != None:
            if bucket_name != None:
                raise Exception("Found multiple possible buckets.")
            
            bucket_name = current_bucket.name

    if bucket_name == None:
        print_colored_message("\nCould not find bucket. Exiting...", FAIL)
        return

    file_path_to_key = get_file_path_to_s3_key(BUILD_DIRECTORY_STR)
    keys_set = set(file_path_to_key.values()) # Checking .values() is O(n), so convert to set for O(1)

    deleted_object_names, ignored_object_names = delete_bucket_objects(
        bucket_name=bucket_name,
        condition=lambda s3_object: s3_object.key not in keys_set or s3_object.key == "index.html"
    )

    ignored_names_set = set(ignored_object_names)

    uploaded_object_names = upload_directory_to_bucket(
        bucket_name=bucket_name,
        directory=BUILD_DIRECTORY_STR,
        exclude_condition=lambda file_path: file_path in ignored_names_set
    )

    print("\nCreating new CloudFront Invalidation...")
    num_uploaded_files = len(uploaded_object_names)
    num_deleted_objects = len(deleted_object_names)
    num_ignored_objects = len(ignored_object_names)

    cloudfront = boto3.client("cloudfront")
    distributions = cloudfront.list_distributions()["DistributionList"]["Items"]

    if len(distributions) != 1:
        # TODO: Should have a standard naming convention to find the distribution in the future
        # For now, just assume we only have 1 distribution on our AWS account
        raise Exception("Found multiple possible distributions.")

    distribution = distributions[0]
    distribution_id = distribution["Id"]
    timestamp = datetime.datetime.now().timestamp()
    invalid_items = [f"/{deleted_object}" for deleted_object in deleted_object_names]

    if (num_deleted_objects > 0):
        cloudfront.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': num_deleted_objects,
                    'Items': invalid_items
                },
                'CallerReference': str(timestamp)
            }
        )

        print(f"Invalidated {num_deleted_objects} items: {invalid_items}")

    print_colored_message(f"\nIgnored {num_ignored_objects} files", WARNING)
    print_colored_message(f"Deleted {num_deleted_objects} files", FAIL)
    print_colored_message(f"Uploaded {num_uploaded_files} files", OK)
    print_colored_message("\nDeployment successful\n", OK)


if __name__ == "__main__":
    main()
