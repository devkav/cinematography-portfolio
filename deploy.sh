#!/bin/bash

ORIGINAL_DIR="$(pwd)"
cd "$(dirname "${BASH_SOURCE[0]}")"

uv run --project ./infra/deploy ./infra/deploy/src/deploy_frontend.py

cd "$ORIGINAL_DIR"
