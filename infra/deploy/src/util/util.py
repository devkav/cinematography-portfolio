import re
import magic
from pathlib import Path


OK = "\033[92m"
WARNING = "\033[93m"
FAIL = "\033[91m"
ENDC = "\033[0m"

# ]]]] <- fix my neovim indenting actin up


def print_colored_message(message, color):
    print(f"{color}{message}{ENDC}")


def remove_root_from_path(path_str, root_str):
    return re.sub(rf"^{root_str}/", "", path_str)


def get_mime_type(path_str):
    file_extension = Path(path_str).suffix

    match file_extension:
        case ".js":
            return "application/javascript"
        case ".css":
            return "text/css"
        case ".sh":
            return "text/x-shellscript"
        case _:
            mimes = magic.Magic(mime=True)
            mime_type = mimes.from_file(path_str)
            return mime_type
