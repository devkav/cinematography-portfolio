#!/bin/bash

set -euo pipefail

ORIGINAL_DIR="$(pwd)"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

PILLOW_VERSION="12.3.0"
PYTHON_VERSION="3.13"
PYTHON_PLATFORM="x86_64-manylinux_2_28"
IMAGING_LAYER_DIR="./infra/terraform/api/layer-imaging/python"

rm -rf "$IMAGING_LAYER_DIR"

uv pip install \
  --target "$IMAGING_LAYER_DIR" \
  --python-platform "$PYTHON_PLATFORM" \
  --python-version "$PYTHON_VERSION" \
  --only-binary :all: \
  "pillow==${PILLOW_VERSION}"

cd "$ORIGINAL_DIR"
