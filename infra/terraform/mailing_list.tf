######################
# Mailing list table #
######################
resource "aws_dynamodb_table" "mailing_list_db" {
  name         = "mailing_list_db"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ProjectID"
  range_key    = "Email"

  attribute {
    name = "ProjectID"
    type = "S"
  }

  attribute {
    name = "Email"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

#################################
# Signup Lambda execution role  #
#################################
resource "aws_iam_role" "signup_lambda_exec" {
  name = "signup_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
      Effect    = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "signup_lambda_logs" {
  role       = aws_iam_role.signup_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "signup_lambda_dynamodb" {
  name = "signup_lambda_dynamodb_policy"
  role = aws_iam_role.signup_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem"]
      Resource = aws_dynamodb_table.mailing_list_db.arn
    }]
  })
}

###################
# Signup function #
###################
data "archive_file" "zip_api_signup" {
  type        = "zip"
  source_file = "./api/signup.py"
  output_path = "./api/signup.zip"
}

resource "aws_lambda_function" "signup_lambda_function" {
  function_name    = "signup_lambda_function"
  handler          = "signup.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.signup_lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_signup.output_base64sha256
  filename         = data.archive_file.zip_api_signup.output_path

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      MAILING_LIST_TABLE_NAME = aws_dynamodb_table.mailing_list_db.name
    }
  }
}

######################
# POST /signup route #
######################
resource "aws_api_gateway_resource" "api_signup_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "signup"
}

resource "aws_api_gateway_method" "post_signup" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_signup_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_lambda_permission" "allow_api_gateway_signup" {
  statement_id  = "AllowExecutionFromAPIGatewaySignup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.signup_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_integration" "api_gateway_signup_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_signup_resource.id
  http_method = aws_api_gateway_method.post_signup.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.signup_lambda_function.invoke_arn
}

resource "aws_api_gateway_method_response" "post_signup_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_signup_resource.id
  http_method = aws_api_gateway_method.post_signup.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "post_signup_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_signup_resource.id
  http_method = aws_api_gateway_method.post_signup.http_method
  status_code = aws_api_gateway_method_response.post_signup_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_signup_integration
  ]
}

resource "aws_api_gateway_method" "options_signup" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_signup_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_signup_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_signup_resource.id
  http_method = aws_api_gateway_method.options_signup.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_signup_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_signup_resource.id
  http_method = aws_api_gateway_method.options_signup.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_signup_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_signup_resource.id
  http_method = aws_api_gateway_method.options_signup.http_method
  status_code = aws_api_gateway_method_response.options_signup_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_signup_integration
  ]
}

###########################################
# Admin read API — GET /mailing-list      #
###########################################
resource "aws_iam_role" "get_mailing_list_lambda_exec" {
  name = "get_mailing_list_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
      Effect    = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "get_mailing_list_lambda_logs" {
  role       = aws_iam_role.get_mailing_list_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "get_mailing_list_lambda_dynamodb" {
  name = "get_mailing_list_lambda_dynamodb_policy"
  role = aws_iam_role.get_mailing_list_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Scan"]
      Resource = aws_dynamodb_table.mailing_list_db.arn
    }]
  })
}

data "archive_file" "zip_api_get_mailing_list" {
  type        = "zip"
  source_file = "./api/get_mailing_list.py"
  output_path = "./api/get_mailing_list.zip"
}

resource "aws_lambda_function" "get_mailing_list_lambda_function" {
  function_name    = "get_mailing_list_lambda_function"
  handler          = "get_mailing_list.handler"
  runtime          = "python3.13"
  role             = aws_iam_role.get_mailing_list_lambda_exec.arn
  source_code_hash = data.archive_file.zip_api_get_mailing_list.output_base64sha256
  filename         = data.archive_file.zip_api_get_mailing_list.output_path

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      MAILING_LIST_TABLE_NAME = aws_dynamodb_table.mailing_list_db.name
    }
  }
}

resource "aws_api_gateway_resource" "api_mailing_list_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "mailing-list"
}

resource "aws_api_gateway_method" "get_mailing_list" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_lambda_permission" "allow_api_gateway_get_mailing_list" {
  statement_id  = "AllowExecutionFromAPIGatewayGetMailingList"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_mailing_list_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_api_gateway_integration" "api_gateway_get_mailing_list_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method = aws_api_gateway_method.get_mailing_list.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_mailing_list_lambda_function.invoke_arn
}

resource "aws_api_gateway_method_response" "get_mailing_list_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method = aws_api_gateway_method.get_mailing_list.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "get_mailing_list_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method = aws_api_gateway_method.get_mailing_list.http_method
  status_code = aws_api_gateway_method_response.get_mailing_list_200.status_code

  depends_on = [
    aws_api_gateway_integration.api_gateway_get_mailing_list_integration
  ]
}

resource "aws_api_gateway_method" "options_get_mailing_list" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_get_mailing_list_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method = aws_api_gateway_method.options_get_mailing_list.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_get_mailing_list_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method = aws_api_gateway_method.options_get_mailing_list.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_get_mailing_list_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_mailing_list_resource.id
  http_method = aws_api_gateway_method.options_get_mailing_list.http_method
  status_code = aws_api_gateway_method_response.options_get_mailing_list_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }

  depends_on = [
    aws_api_gateway_integration.options_get_mailing_list_integration
  ]
}
