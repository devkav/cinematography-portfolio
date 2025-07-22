import boto3
import re
import glob
from pathlib import Path
import datetime
from util.io import remove_root_from_path, get_mime_type
from util.output import print_colored_message, FAIL, WARNING, OK


def main():
    num_ignored_files = 0

    s3 = boto3.resource('s3')
    bucket = None

    for current_bucket in s3.buckets.all():
        if re.match(r'^terraform', current_bucket.name) != None:
            if bucket != None:
                print_colored_message("\nFound multiple possible buckets. Exiting...", FAIL)
                return
            
            bucket = current_bucket 

    if bucket == None:
        print_colored_message("\nCould not find bucket. Exiting...", FAIL)
        return

    root_directory = Path(__file__).parent.parent.parent.parent
    build_directory = root_directory.joinpath("frontend/build/client")
    build_directory_str = str(build_directory)

    build_paths = glob.glob(f"{build_directory_str}/**", recursive=True)
    build_file_names = set()
    build_file_paths = {}

    for build_path in build_paths:
        if not Path(build_path).is_file():
            continue

        build_file_name = remove_root_from_path(build_path, build_directory_str)
        build_file_names.add(build_file_name)
        build_file_paths[build_file_name] = str(build_path)

    unchanged_objects = set()
    deleted_objects = []

    for s3_object in bucket.objects.all():
        object_name = s3_object.key

        # Always delete index.html just to be safe, since the name does not change
        if object_name in build_file_names and object_name != "index.html":
            print_colored_message(f"Ignoring {object_name}; no changes.", WARNING)
            unchanged_objects.add(object_name)
            num_ignored_files += 1
        else:
            print_colored_message(f"Deleting {object_name}", FAIL)
            s3.Object(bucket.name, object_name).delete()
            deleted_objects.append(object_name)

    new_files = list(filter(lambda build_file: build_file not in unchanged_objects, build_file_names)) 

    for file_name in new_files:
        print_colored_message(f"Uploading {file_name}", OK)
        file_path = build_file_paths[file_name]
        mime_type = get_mime_type(file_path)

        s3.meta.client.upload_file(file_path, bucket.name, file_name, ExtraArgs={'ContentType': mime_type})

    print("\nCreating new CloudFront Invalidation...")
    num_uploaded_files = len(new_files)
    num_deleted_objects = len(deleted_objects)

    cloudfront = boto3.client("cloudfront")
    distributions = cloudfront.list_distributions()["DistributionList"]["Items"]

    if len(distributions) != 1:
        # TODO: Should have a standard naming convention to find the distribution in the future
        # For now, just assume we only have 1 distribution on our AWS account
        print_colored_message("Found multiple possible distributions. Exiting...", FAIL)
        return

    distribution = distributions[0]
    distribution_id = distribution["Id"]
    timestamp = datetime.datetime.now().timestamp()
    invalid_items = [f"/{deleted_object}" for deleted_object in deleted_objects]

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

    print_colored_message(f"\nIgnored {num_ignored_files} files", WARNING)
    print_colored_message(f"Deleted {num_deleted_objects} files", FAIL)
    print_colored_message(f"Uploaded {num_uploaded_files} files", OK)
    print_colored_message("\nDeployment successful\n", OK)


if __name__ == "__main__":
    main()
