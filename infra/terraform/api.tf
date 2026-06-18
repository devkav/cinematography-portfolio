resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
      Effect    = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda_dynamodb_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Resource = aws_dynamodb_table.assets_db.arn
    }]
  })
}

resource "aws_iam_role_policy" "lambda_s3_upload" {
  name = "lambda_s3_upload_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.assets_bucket.arn}/*"
    }]
  })
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "assets_api"
  description = "API to retrieve assets"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "api_assets_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "assets"
}

data "archive_file" "zip_api_assets" {
  type        = "zip"
  source_file = "./api/get_assets.py"
  output_path = "./api/get_assets.zip"
}

resource "aws_lambda_function" "get_assets_lambda_function" {
  function_name    = "get_assets_lambda_function"
  handler          = "get_assets.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_assets.output_base64sha256
  filename         = data.archive_file.zip_api_assets.output_path

  environment {
    variables = {
      ASSETS_TABLE_NAME        = aws_dynamodb_table.assets_db.name
      ASSETS_CLOUDFRONT_DOMAIN = aws_cloudfront_distribution.assets_distribution.domain_name
    }
  }
}

# API Gateway method
resource "aws_api_gateway_method" "get_assets" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_assets_resource.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.querystring.length" = true
    "method.request.querystring.width"  = true
  }
}

# Lambda permission for API Gateway Lambda permission for API Gateway
resource "aws_lambda_permission" "allow_api_gateway_assets" {
  statement_id  = "AllowExecutionFromAPIGatewayCurrent"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_assets_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  # The source ARN of the API Gateway
  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

# API Gateway integration with Lambda
resource "aws_api_gateway_integration" "api_gateway_assets_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_assets_resource.id
  http_method = aws_api_gateway_method.get_assets.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_assets_lambda_function.invoke_arn
}

resource "aws_api_gateway_deployment" "assets_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.api_gateway_assets_integration,
    aws_api_gateway_integration.api_gateway_uploads_integration,
    aws_api_gateway_integration.options_uploads_integration,
    aws_api_gateway_integration.api_gateway_upload_asset_integration,
    aws_api_gateway_integration.options_upload_asset_integration,
    aws_api_gateway_integration.api_gateway_analytics_integration,
    aws_api_gateway_integration.options_analytics_integration,
  ]
  rest_api_id = aws_api_gateway_rest_api.api.id

  # This forces a new deployment when the API configuration changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api_assets_resource.id,
      aws_api_gateway_method.get_assets.id,
      aws_api_gateway_integration.api_gateway_assets_integration.id,
      aws_api_gateway_resource.api_uploads_resource.id,
      aws_api_gateway_method.post_uploads.id,
      aws_api_gateway_method.options_uploads.id,
      aws_api_gateway_integration.api_gateway_uploads_integration.id,
      aws_api_gateway_integration.options_uploads_integration.id,
      aws_api_gateway_authorizer.cognito.id,
      aws_api_gateway_resource.api_upload_asset_resource.id,
      aws_api_gateway_method.post_upload_asset.id,
      aws_api_gateway_method.options_upload_asset.id,
      aws_api_gateway_integration.api_gateway_upload_asset_integration.id,
      aws_api_gateway_integration.options_upload_asset_integration.id,
      aws_api_gateway_resource.api_analytics_resource.id,
      aws_api_gateway_resource.api_analytics_resource.path_part,
      aws_api_gateway_method.post_analytics.id,
      aws_api_gateway_method.options_analytics.id,
      aws_api_gateway_integration.api_gateway_analytics_integration.id,
      aws_api_gateway_integration.options_analytics_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Method response
resource "aws_api_gateway_method_response" "get_assets_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_assets_resource.id
  http_method = aws_api_gateway_method.get_assets.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# Integration response
resource "aws_api_gateway_integration_response" "get_assets_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_assets_resource.id
  http_method = aws_api_gateway_method.get_assets.http_method
  status_code = aws_api_gateway_method_response.get_assets_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_assets_integration
  ]
}

resource "aws_api_gateway_stage" "cloudcast_api_gateway_stage" {
  deployment_id = aws_api_gateway_deployment.assets_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "prod"
}

#####################
# Upload URL Lambda #
#####################
data "archive_file" "zip_api_upload_url" {
  type        = "zip"
  source_file = "./api/get_upload_url.py"
  output_path = "./api/get_upload_url.zip"
}

resource "aws_lambda_function" "get_upload_url_lambda_function" {
  function_name    = "get_upload_url_lambda_function"
  handler          = "get_upload_url.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_upload_url.output_base64sha256
  filename         = data.archive_file.zip_api_upload_url.output_path

  environment {
    variables = {
      ASSETS_BUCKET_NAME = aws_s3_bucket.assets_bucket.id
    }
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito_authorizer"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.admin_pool.arn]
}

resource "aws_api_gateway_resource" "api_uploads_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "uploads"
}

# POST /uploads — Cognito-protected, returns presigned URL
resource "aws_api_gateway_method" "post_uploads" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_uploads_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_lambda_permission" "allow_api_gateway_uploads" {
  statement_id  = "AllowExecutionFromAPIGatewayUploads"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_upload_url_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_integration" "api_gateway_uploads_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_uploads_resource.id
  http_method = aws_api_gateway_method.post_uploads.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_upload_url_lambda_function.invoke_arn
}

resource "aws_api_gateway_method_response" "post_uploads_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_uploads_resource.id
  http_method = aws_api_gateway_method.post_uploads.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "post_uploads_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_uploads_resource.id
  http_method = aws_api_gateway_method.post_uploads.http_method
  status_code = aws_api_gateway_method_response.post_uploads_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_uploads_integration
  ]
}

# OPTIONS /uploads — CORS preflight (Authorization header triggers it)
resource "aws_api_gateway_method" "options_uploads" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_uploads_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_uploads_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_uploads_resource.id
  http_method = aws_api_gateway_method.options_uploads.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_uploads_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_uploads_resource.id
  http_method = aws_api_gateway_method.options_uploads.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_uploads_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_uploads_resource.id
  http_method = aws_api_gateway_method.options_uploads.http_method
  status_code = aws_api_gateway_method_response.options_uploads_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_uploads_integration
  ]
}

#######################
# Upload Asset Lambda #
#######################
data "archive_file" "zip_api_upload_asset" {
  type        = "zip"
  source_file = "./api/upload_asset.py"
  output_path = "./api/upload_asset.zip"
}

resource "aws_lambda_function" "upload_asset_lambda_function" {
  function_name    = "upload_asset_lambda_function"
  handler          = "upload_asset.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_upload_asset.output_base64sha256
  filename         = data.archive_file.zip_api_upload_asset.output_path

  environment {
    variables = {
      ASSETS_TABLE_NAME = aws_dynamodb_table.assets_db.name
    }
  }
}

resource "aws_api_gateway_resource" "api_upload_asset_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "upload_asset"
}

# POST /upload_asset — Cognito-protected, records asset metadata
resource "aws_api_gateway_method" "post_upload_asset" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_lambda_permission" "allow_api_gateway_upload_asset" {
  statement_id  = "AllowExecutionFromAPIGatewayUploadAsset"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_asset_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_integration" "api_gateway_upload_asset_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method = aws_api_gateway_method.post_upload_asset.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.upload_asset_lambda_function.invoke_arn
}

resource "aws_api_gateway_method_response" "post_upload_asset_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method = aws_api_gateway_method.post_upload_asset.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "post_upload_asset_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method = aws_api_gateway_method.post_upload_asset.http_method
  status_code = aws_api_gateway_method_response.post_upload_asset_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_upload_asset_integration
  ]
}

# OPTIONS /upload_asset — CORS preflight
resource "aws_api_gateway_method" "options_upload_asset" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_upload_asset_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method = aws_api_gateway_method.options_upload_asset.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_upload_asset_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method = aws_api_gateway_method.options_upload_asset.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_upload_asset_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_upload_asset_resource.id
  http_method = aws_api_gateway_method.options_upload_asset.http_method
  status_code = aws_api_gateway_method_response.options_upload_asset_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_upload_asset_integration
  ]
}
