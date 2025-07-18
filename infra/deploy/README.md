# frontend-deployment

Custom frontend deployment pipeline script. This script uploads changed build files to the S3 bucket and deletes stale files.
Additionally, it creates a Cloudfront Invalidation to clear the stale files from the cache.

To deploy the frontend, simply run the script using uv.
```
uv run main.py
```
