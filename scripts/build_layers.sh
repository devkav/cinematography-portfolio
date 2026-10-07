#!/bin/bash

set -euo pipefail

ORIGINAL_DIR="$(pwd)"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

PILLOW_VERSION="12.3.0"
PYTHON_VERSION="3.13"
PYTHON_PLATFORM="x86_64-manylinux_2_28"
IMAGING_LAYER_DIR="./infra/terraform/api/layer-imaging/python"

FFMPEG_VERSION="6.0.1"
FFMPEG_SHA256="28268bf402f1083833ea269331587f60a242848880073be8016501d864bd07a5"
FFMPEG_URL="https://johnvansickle.com/ffmpeg/old-releases/ffmpeg-${FFMPEG_VERSION}-amd64-static.tar.xz"
VIDEO_LAYER_DIR="./infra/terraform/api/layer-video/bin"

rm -rf "$IMAGING_LAYER_DIR"

uv pip install \
  --target "$IMAGING_LAYER_DIR" \
  --python-platform "$PYTHON_PLATFORM" \
  --python-version "$PYTHON_VERSION" \
  --only-binary :all: \
  "pillow==${PILLOW_VERSION}"

FFMPEG_ARCHIVE="$(mktemp)"
trap 'rm -f "$FFMPEG_ARCHIVE"' EXIT

curl --fail --silent --show-error --location --output "$FFMPEG_ARCHIVE" "$FFMPEG_URL"
echo "${FFMPEG_SHA256}  ${FFMPEG_ARCHIVE}" | sha256sum --check --quiet

rm -rf "$VIDEO_LAYER_DIR"
mkdir -p "$VIDEO_LAYER_DIR"
tar --extract --xz --file "$FFMPEG_ARCHIVE" --directory "$VIDEO_LAYER_DIR" --strip-components 1 \
  "ffmpeg-${FFMPEG_VERSION}-amd64-static/ffmpeg"
chmod 755 "$VIDEO_LAYER_DIR/ffmpeg"

cd "$ORIGINAL_DIR"
