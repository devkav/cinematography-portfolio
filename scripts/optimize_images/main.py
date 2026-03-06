from pathlib import Path

import typer
from PIL import Image
from rich.console import Console

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"}
MAX_DIMENSION = 2048
DEFAULT_QUALITY = 85

console = Console()


def find_images(directory: Path) -> list[Path]:
    images = []

    for file in sorted(directory.rglob("*")):
        if file.suffix.lower() in IMAGE_EXTENSIONS and file.is_file():
            images.append(file)

    return images


def get_total_size(files: list[Path]) -> int:
    return sum(f.stat().st_size for f in files)


def format_size(size_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"

        size_bytes /= 1024

    return f"{size_bytes:.1f} TB"


def strip_metadata(img: Image.Image) -> Image.Image:
    clean = Image.new(img.mode, img.size)
    clean.putdata(img.get_flattened_data())
    return clean


def optimize_image(path: Path, max_dim: int, quality: int) -> None:
    with Image.open(path) as img:
        original_format = img.format
        width, height = img.size

        if width > max_dim or height > max_dim:
            ratio = min(max_dim / width, max_dim / height)
            new_size = (round(width * ratio), round(height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        img = strip_metadata(img)

        save_kwargs: dict = {}
        ext = path.suffix.lower()

        if ext in (".jpg", ".jpeg"):
            save_kwargs["quality"] = quality
            save_kwargs["optimize"] = True
        elif ext == ".png":
            save_kwargs["optimize"] = True
        elif ext == ".webp":
            save_kwargs["quality"] = quality
            save_kwargs["method"] = 6
        elif ext in (".tiff", ".tif"):
            save_kwargs["compression"] = "tiff_deflate"

        # Preserve format to avoid issues with extension mismatches
        if original_format:
            save_kwargs["format"] = original_format

        img.save(path, **save_kwargs)


def main(
    directory: Path = typer.Argument(help="Directory containing images to optimize"),
    max_size: int = typer.Option(MAX_DIMENSION, help="Maximum dimension in pixels"),
    quality: int = typer.Option(DEFAULT_QUALITY, help="JPEG/WebP quality 1-100"),
    dry_run: bool = typer.Option(False, help="Show what would be done without modifying files"),
) -> None:
    """Optimize images for the web by resizing and compressing them."""
    directory = directory.resolve()

    if not directory.is_dir():
        console.print(f"[red]Error:[/red] '{directory}' is not a directory")
        raise typer.Exit(code=1)

    images = find_images(directory)

    if not images:
        console.print("No images found.")
        return

    total_before = get_total_size(images)
    count = len(images)

    console.print(f"Found [bold]{count}[/bold] image{'s' if count != 1 else ''}")
    console.print(f"Total size before: [bold]{format_size(total_before)}[/bold]")

    if dry_run:
        console.print("[dim](dry run — no files will be modified)[/dim]")
        return

    console.print()

    for i, path in enumerate(images, 1):
        relative_path = path.relative_to(directory)
        size_before = path.stat().st_size

        optimize_image(path, max_size, quality)

        size_after = path.stat().st_size
        change_percent = ((size_before - size_after) / size_before * 100) if size_before > 0 else 0

        console.print(
            f"  [dim][{i}/{count}][/dim] {relative_path}  "
            f"{format_size(size_before)} -> {format_size(size_after)} "
            f"[green](-{change_percent:.1f}%)[/green]"
        )

    total_after = get_total_size(images)
    saved = total_before - total_after
    savings_percent = (saved / total_before * 100) if total_before > 0 else 0

    console.print()
    console.print(f"Total size before: [bold]{format_size(total_before)}[/bold]")
    console.print(f"Total size after:  [bold green]{format_size(total_after)}[/bold green]")
    console.print(f"Saved:             [bold green]{format_size(saved)} ({savings_percent:.1f}%)[/bold green]")


if __name__ == "__main__":
    typer.run(main)
