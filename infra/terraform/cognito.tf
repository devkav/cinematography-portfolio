resource "aws_cognito_user_pool" "admin_pool" {
  name = "admin_pool"

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  # Disable public sign-up — only admins can create users
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  # Only an admin can reset a forgotten password
  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_client" "admin_pool_client" {
  name         = "admin_pool_client"
  user_pool_id = aws_cognito_user_pool.admin_pool.id

  # SPAs cannot keep secrets
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Don't reveal whether a username exists on failed sign-in attempts
  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}
