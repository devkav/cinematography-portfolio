data "archive_file" "zip_common_layer" {
  type        = "zip"
  source_dir  = "./api/layer"
  output_path = "./api/common_layer.zip"
}

resource "aws_lambda_layer_version" "common" {
  layer_name          = "api_common"
  filename            = data.archive_file.zip_common_layer.output_path
  source_code_hash    = data.archive_file.zip_common_layer.output_base64sha256
  compatible_runtimes = ["python3.13"]
}
