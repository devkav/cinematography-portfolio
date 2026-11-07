################
# Reels Lambda #
################
data "archive_file" "zip_api_manage_reels" {
  type        = "zip"
  source_file = "./api/manage_reels.py"
  output_path = "./api/manage_reels.zip"
}

resource "aws_lambda_function" "manage_reels_lambda_function" {
  function_name    = "manage_reels_lambda_function"
  handler          = "manage_reels.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_manage_reels.output_base64sha256
  filename         = data.archive_file.zip_api_manage_reels.output_path

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      ASSETS_TABLE_NAME = aws_dynamodb_table.assets_db.name
    }
  }
}

resource "aws_api_gateway_resource" "api_reels_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "reels"
}

resource "aws_api_gateway_method" "reels" {
  for_each = toset(["GET", "PUT"])

  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_reels_resource.id
  http_method   = each.value
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "reels" {
  for_each = aws_api_gateway_method.reels

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_reels_resource.id
  http_method = each.value.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.manage_reels_lambda_function.invoke_arn
}

resource "aws_lambda_permission" "allow_api_gateway_manage_reels" {
  statement_id  = "AllowExecutionFromAPIGatewayManageReels"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.manage_reels_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_method" "options_reels" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_reels_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_reels_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_reels_resource.id
  http_method = aws_api_gateway_method.options_reels.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_reels_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_reels_resource.id
  http_method = aws_api_gateway_method.options_reels.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_reels_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_reels_resource.id
  http_method = aws_api_gateway_method.options_reels.http_method
  status_code = aws_api_gateway_method_response.options_reels_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_reels_integration
  ]
}
