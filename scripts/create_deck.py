#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = []
# ///
"""Crea una presentación estática desde un JSON de contenido.
Uso: uv run --script scripts/create_deck.py --content contenido.json --output destino [--force]
"""
import argparse
import base64
import mimetypes
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--content', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--force', action='store_true', help='Permitir sobrescribir los ficheros generados')
    a = parser.parse_args()
    data = json.loads(a.content.read_text(encoding='utf-8'))
    if not data.get('meta') or not data.get('slides'):
        parser.error('El JSON necesita meta y slides no vacíos')
    # Recursos locales declarados en meta.logos se incrustan en el JSON como data URIs.
    logos = data.get('meta', {}).get('logos', [])
    if not isinstance(logos, list) or len(logos) > 3:
        parser.error('meta.logos debe ser una lista de 0 a 3 elementos')
    for logo in logos:
        if not isinstance(logo, dict) or not isinstance(logo.get('src'), str):
            parser.error('Cada logo necesita src y alt')
        src = logo['src']
        if src.startswith('data:'):
            continue
        if '://' in src or src.startswith('//'):
            parser.error('Los logos deben ser archivos locales o data URIs, nunca URLs remotas')
        img_path = (a.content.parent / src).resolve()
        mime = mimetypes.guess_type(img_path.name)[0]
        if mime not in ('image/png','image/jpeg','image/webp','image/gif'):
            parser.error('Logo con formato no admitido: ' + src)
        if not img_path.is_file() or img_path.stat().st_size > 5*1024*1024:
            parser.error('Logo ausente o superior a 5 MiB: ' + src)
        logo['src'] = 'data:' + mime + ';base64,' + base64.b64encode(img_path.read_bytes()).decode('ascii')
        logo.setdefault('alt', img_path.stem)
    files = {'index.html': HERE/'assets/index.html', 'assets/slides.css': HERE/'assets/slides.css',
             'assets/slides.js': HERE/'assets/slides.js', 'assets/exercises.js': HERE/'assets/exercises.js',
             'assets/editor.js': HERE/'assets/editor.js', 'assets/editor.css': HERE/'assets/editor.css'}
    for rel, source in files.items():
        target = a.output/rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and not a.force:
            parser.error(f'El archivo {target} ya existe. Usa --force para sobrescribir')
        shutil.copy2(source, target)
    target = a.output/'assets/content.json'
    if target.exists() and not a.force:
        parser.error(f'El archivo {target} ya existe. Usa --force para sobrescribir')
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    readme = a.output/'README.md'
    if not readme.exists():
        readme.write_text('# '+data['meta'].get('title','Presentación')+'\n\nEjecuta `python3 -m http.server 8000 -d .` desde esta carpeta y abre http://localhost:8000.\n', encoding='utf-8')
    print(f'OK: presentación generada en {a.output.resolve()} ({len(data["slides"])} slides)')
if __name__ == '__main__':
    main()
