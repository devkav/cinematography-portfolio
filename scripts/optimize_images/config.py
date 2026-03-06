from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


class Config:
    # Supported image formats
    IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".heic", ".heif"}
    CONVERT_TO_JPEG = {".heic", ".heif", ".tiff", ".tif", ".webp"}

    # Optimization defaults
    MAX_DIMENSION = 2048
    DEFAULT_QUALITY = 85
