#!/bin/bash

ORIGINAL_DIR="$(pwd)"
cd "$(dirname "${BASH_SOURCE[0]}")"

npm run build --prefix frontend

cd "$ORIGINAL_DIR"
