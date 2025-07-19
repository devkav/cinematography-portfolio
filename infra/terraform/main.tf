locals {
  s3_origin_id = "myS3Origin"
}


provider "aws" {
  region = "us-east-1"
}


data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "static_bucket" {}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption_configuration" {
  bucket = aws_s3_bucket.static_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.static_bucket.id

  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.static_bucket.id
  policy = data.aws_iam_policy_document.cloudfront_private_content.json
}

data "aws_iam_policy_document" "cloudfront_private_content" {
  statement {
    resources = ["arn:aws:s3:::${aws_s3_bucket.static_bucket.id}/*"]

    actions = ["s3:GetObject*"]

    condition {
      test = "StringEquals"
      variable = "AWS:SourceArn"
      values = [
        "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.static_distribution.id}"
      ]
    }

    principals {
      type = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
  }
}


resource "aws_cloudfront_distribution" "static_distribution" {
  origin {
    domain_name = aws_s3_bucket.static_bucket.bucket_regional_domain_name
    origin_id = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.cf_origin_access_control.id
  }

  enabled = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin
    response_headers_policy_id = "eaab4381-ed33-4a86-88ca-d9558dc6cd63" # CORS-with-preflight-and-SecurityHeadersPolicy
    viewer_protocol_policy = "redirect-to-https"
  }

  # TODO: Could add custom error pages such as 404 page

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Route everything to index.html for single page app
  custom_error_response {
    error_code = "403"
    response_code = "200"
    response_page_path = "/index.html"
  }
}

resource "aws_cloudfront_origin_access_control" "cf_origin_access_control" {
  name = "cf_origin_access_control"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}


output "bucket_name" {
  value = aws_s3_bucket.static_bucket.id
}

output "domain" {
  value = aws_cloudfront_distribution.static_distribution.domain_name
}
