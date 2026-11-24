"""Utilidades comunes: los scripts se ejecutan siempre con uv, como en la documentación."""
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UV = shutil.which('uv')


def run_script(name, *args):
    if not UV:
        raise RuntimeError('uv no está instalado: https://docs.astral.sh/uv/getting-started/installation/')
    return subprocess.run([UV, 'run', '--quiet', '--script', str(ROOT / 'scripts' / name), *map(str, args)],
                          capture_output=True, text=True)
