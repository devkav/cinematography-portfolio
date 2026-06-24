###################
# Analytics table #
###################
resource "aws_dynamodb_table" "analytics_db" {
  name         = "analytics_db"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "SessionID"
  range_key    = "Timestamp"

  attribute {
    name = "SessionID"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "S"
  }
}

##############################
# Analytics Lambda execution #
##############################
resource "aws_iam_role" "analytics_lambda_exec" {
  name = "analytics_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
      Effect    = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "analytics_lambda_logs" {
  role       = aws_iam_role.analytics_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "analytics_lambda_dynamodb" {
  name = "analytics_lambda_dynamodb_policy"
  role = aws_iam_role.analytics_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem"]
      Resource = aws_dynamodb_table.analytics_db.arn
    }]
  })
}

###################
# Ingest function #
###################
data "archive_file" "zip_api_analytics" {
  type        = "zip"
  source_file = "./api/analytics.py"
  output_path = "./api/analytics.zip"
}

resource "aws_lambda_function" "analytics_lambda_function" {
  function_name    = "analytics_lambda_function"
  handler          = "analytics.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.analytics_lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_analytics.output_base64sha256
  filename         = data.archive_file.zip_api_analytics.output_path

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      ANALYTICS_TABLE_NAME = aws_dynamodb_table.analytics_db.name
    }
  }
}

#########################
# POST /analytics route #
#########################
resource "aws_api_gateway_resource" "api_analytics_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "c"
}

resource "aws_api_gateway_method" "post_analytics" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_analytics_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_lambda_permission" "allow_api_gateway_analytics" {
  statement_id  = "AllowExecutionFromAPIGatewayAnalytics"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_integration" "api_gateway_analytics_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_analytics_resource.id
  http_method = aws_api_gateway_method.post_analytics.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.analytics_lambda_function.invoke_arn
}

resource "aws_api_gateway_method_response" "post_analytics_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_analytics_resource.id
  http_method = aws_api_gateway_method.post_analytics.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "post_analytics_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_analytics_resource.id
  http_method = aws_api_gateway_method.post_analytics.http_method
  status_code = aws_api_gateway_method_response.post_analytics_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_analytics_integration
  ]
}

resource "aws_api_gateway_method" "options_analytics" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_analytics_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_analytics_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_analytics_resource.id
  http_method = aws_api_gateway_method.options_analytics.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_analytics_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_analytics_resource.id
  http_method = aws_api_gateway_method.options_analytics.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_analytics_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_analytics_resource.id
  http_method = aws_api_gateway_method.options_analytics.http_method
  status_code = aws_api_gateway_method_response.options_analytics_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_analytics_integration
  ]
}

##########################################
# CloudFront front door for viewer geo   #
##########################################
resource "aws_cloudfront_origin_request_policy" "analytics_viewer_geo" {
  name = "analytics-viewer-geo"

  cookies_config {
    cookie_behavior = "none"
  }

  query_strings_config {
    query_string_behavior = "none"
  }

  headers_config {
    header_behavior = "whitelist"

    headers {
      items = [
        "CloudFront-Viewer-Country",
        "CloudFront-Viewer-Country-Region",
        "CloudFront-Viewer-Country-Region-Name",
        "CloudFront-Viewer-City",
        "CloudFront-Viewer-Latitude",
        "CloudFront-Viewer-Longitude",
        "Origin",
        "User-Agent",
      ]
    }
  }
}

resource "aws_cloudfront_distribution" "analytics_distribution" {
  enabled = true

  origin {
    domain_name = "${aws_api_gateway_rest_api.api.id}.execute-api.${local.aws_region}.amazonaws.com"
    origin_id   = "analytics_api_origin"
    origin_path = "/${aws_api_gateway_stage.cloudcast_api_gateway_stage.stage_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id         = "analytics_api_origin"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    viewer_protocol_policy   = "https-only"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = aws_cloudfront_origin_request_policy.analytics_viewer_geo.id
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

#####################################
# Admin read API — GET /analytics   #
#####################################
resource "aws_iam_role" "get_analytics_lambda_exec" {
  name = "get_analytics_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
      Effect    = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "get_analytics_lambda_logs" {
  role       = aws_iam_role.get_analytics_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "get_analytics_lambda_dynamodb" {
  name = "get_analytics_lambda_dynamodb_policy"
  role = aws_iam_role.get_analytics_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Scan"]
      Resource = aws_dynamodb_table.analytics_db.arn
    }]
  })
}

data "archive_file" "zip_api_get_analytics" {
  type        = "zip"
  source_file = "./api/get_analytics.py"
  output_path = "./api/get_analytics.zip"
}

resource "aws_lambda_function" "get_analytics_lambda_function" {
  function_name    = "get_analytics_lambda_function"
  handler          = "get_analytics.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.get_analytics_lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_get_analytics.output_base64sha256
  filename         = data.archive_file.zip_api_get_analytics.output_path

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      ANALYTICS_TABLE_NAME = aws_dynamodb_table.analytics_db.name
    }
  }
}

resource "aws_api_gateway_resource" "api_get_analytics_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "analytics"
}

resource "aws_api_gateway_method" "get_analytics" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_lambda_permission" "allow_api_gateway_get_analytics" {
  statement_id  = "AllowExecutionFromAPIGatewayGetAnalytics"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_analytics_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_integration" "api_gateway_get_analytics_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method = aws_api_gateway_method.get_analytics.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_analytics_lambda_function.invoke_arn
}

resource "aws_api_gateway_method_response" "get_analytics_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method = aws_api_gateway_method.get_analytics.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "get_analytics_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method = aws_api_gateway_method.get_analytics.http_method
  status_code = aws_api_gateway_method_response.get_analytics_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_get_analytics_integration
  ]
}

resource "aws_api_gateway_method" "options_get_analytics" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_get_analytics_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method = aws_api_gateway_method.options_get_analytics.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_get_analytics_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method = aws_api_gateway_method.options_get_analytics.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_get_analytics_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_get_analytics_resource.id
  http_method = aws_api_gateway_method.options_get_analytics.http_method
  status_code = aws_api_gateway_method_response.options_get_analytics_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_get_analytics_integration
  ]
}
