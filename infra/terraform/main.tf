###########
# Globals #
###########
locals {
  static_origin_id = "static_origin"
  assets_origin_id = "assets_origin"

  static_bucket_name = "prod-static-maggieclucy"
  assets_bucket_name = "prod-assets-maggieclucy"

  domain_name = "maggieclucy.com"
  aws_region  = "us-east-1"
}

provider "aws" {
  region = local.aws_region
}

data "aws_caller_identity" "current" {}


###############################
# Shared Policies and Configs #
###############################
resource "aws_cloudfront_origin_access_control" "cf_origin_access_control" {
  name                              = "cf_origin_access_control"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
