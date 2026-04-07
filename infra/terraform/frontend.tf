resource "aws_s3_bucket" "static_bucket" {
  bucket = local.static_bucket_name
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_encryption_configuration" {
  bucket = aws_s3_bucket.static_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static_public_access" {
  bucket = aws_s3_bucket.static_bucket.id

  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "static_bucket_policy" {
  bucket = aws_s3_bucket.static_bucket.id
  policy = data.aws_iam_policy_document.static_cloudfront_private_content.json
}

data "aws_iam_policy_document" "static_cloudfront_private_content" {
  statement {
    resources = ["${aws_s3_bucket.static_bucket.arn}/*"]
    actions = ["s3:GetObject*"]

    condition {
      test = "StringEquals"
      variable = "AWS:SourceArn"
      values = [aws_cloudfront_distribution.static_distribution.arn]
    }

    principals {
      type = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
  }
}

resource "aws_acm_certificate" "certificate" {
  domain_name = local.domain_name
  region = local.aws_region
  validation_method = "DNS"
  key_algorithm = "RSA_2048"

  subject_alternative_names = [
    local.domain_name,
    "*.${local.domain_name}"
  ]
}

resource "aws_cloudfront_distribution" "static_distribution" {
  origin {
    domain_name = aws_s3_bucket.static_bucket.bucket_regional_domain_name
    origin_id = local.static_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.cf_origin_access_control.id
  }

  aliases = [
    local.domain_name,
    "www.${local.domain_name}"
  ]

  enabled = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = local.static_origin_id
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
    acm_certificate_arn = aws_acm_certificate.certificate.arn
    cloudfront_default_certificate = false
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method = "sni-only"
  }

  # Route everything to index.html for single page app
  custom_error_response {
    error_code = "403"
    response_code = "200"
    response_page_path = "/index.html"
  }
}
