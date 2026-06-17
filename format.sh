#!/bin/bash

ORIGINAL_DIR="$(pwd)"
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Formatting frontend..."
npm run --prefix frontend format
echo
echo "Formatting backend..."
terraform -chdir=infra/terraform fmt -recursive

cd "$ORIGINAL_DIR"
