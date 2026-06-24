#!/bin/bash

ORIGINAL_DIR="$(pwd)"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

npm run format --prefix frontend
terraform -chdir="./infra/terraform" fmt -recursive

cd "$ORIGINAL_DIR"
