output "static_bucket_name" {
  value = aws_s3_bucket.static_bucket.id
}

output "assets_bucket_name" {
  value = aws_s3_bucket.assets_bucket.id
}

output "domain" {
  value = aws_cloudfront_distribution.static_distribution.domain_name
}

output "api_url" {
  value = aws_api_gateway_stage.cloudcast_api_gateway_stage.invoke_url
}

output "analytics_url" {
  value = "https://${aws_cloudfront_distribution.analytics_distribution.domain_name}"
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.admin_pool.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.admin_pool_client.id
}
