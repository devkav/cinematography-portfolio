OK = "\033[92m"
WARNING = "\033[93m"
FAIL = "\033[91m"
ENDC = "\033[0m"

# ]]]] <- fix my neovim indenting actin up


def print_colored_message(message, color):
    print(f"{color}{message}{ENDC}")
