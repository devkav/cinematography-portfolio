resource "aws_s3_bucket" "assets_bucket" {
  bucket = local.assets_bucket_name
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_encryption_configuration" {
  bucket = aws_s3_bucket.assets_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets_public_access" {
  bucket = aws_s3_bucket.assets_bucket.id

  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "assets_cors" {
  bucket = aws_s3_bucket.assets_bucket.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = [
      "http://localhost:5173",
      "https://maggieclucy.com",
      "https://www.maggieclucy.com"
    ]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "assets_bucket_policy" {
  bucket = aws_s3_bucket.assets_bucket.id
  policy = data.aws_iam_policy_document.assets_cloudfront_private_content.json
}

data "aws_iam_policy_document" "assets_cloudfront_private_content" {
  statement {
    resources = ["${aws_s3_bucket.assets_bucket.arn}/*"]
    actions = ["s3:GetObject*"]

    condition {
      test = "StringEquals"
      variable = "AWS:SourceArn"
      values = [aws_cloudfront_distribution.assets_distribution.arn]
    }

    principals {
      type = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
  }
}

resource "aws_cloudfront_distribution" "assets_distribution" {
  origin {
    domain_name = aws_s3_bucket.assets_bucket.bucket_regional_domain_name
    origin_id = local.assets_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.cf_origin_access_control.id
  }

  enabled = true

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = local.assets_origin_id
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin
    response_headers_policy_id = "eaab4381-ed33-4a86-88ca-d9558dc6cd63" # CORS-with-preflight-and-SecurityHeadersPolicy
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
