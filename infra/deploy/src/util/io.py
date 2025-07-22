import re
import magic
from pathlib import Path

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

