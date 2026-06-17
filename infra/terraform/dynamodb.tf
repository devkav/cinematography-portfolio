resource "aws_dynamodb_table" "assets_db" {
  name         = "assets_db"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Type"
  range_key    = "AssetID"

  attribute {
    name = "Type"
    type = "S"
  }

  attribute {
    name = "AssetID"
    type = "S"
  }
}
