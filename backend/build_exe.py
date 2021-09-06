"""Build a standalone DenkoCyber backend .exe with PyInstaller.

Usage:
    python build_exe.py

The output is written to backend/dist/DenkoCyberBackend.exe.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
ENTRY = ROOT / "run_backend.py"


def main() -> int:
    if shutil.which("pyinstaller") is None:
        print("PyInstaller is not installed. Run: pip install -r requirements.txt")
        return 1

    args = [
        "pyinstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--name",
        "DenkoCyberBackend",
        "--distpath",
        str(ROOT / "dist"),
        "--workpath",
        str(ROOT / "build"),
        "--specpath",
        str(ROOT),
        # Ensure uvicorn / fastapi submodules are bundled
        "--collect-all",
        "uvicorn",
        "--collect-all",
        "fastapi",
        "--collect-all",
        "passlib",
        "--hidden-import",
        "passlib.handlers.bcrypt",
        "--hidden-import",
        "sqlalchemy.dialects.sqlite",
        str(ENTRY),
    ]
    print("Running:", " ".join(args))
    return subprocess.call(args, cwd=ROOT)


if __name__ == "__main__":
    sys.exit(main())
