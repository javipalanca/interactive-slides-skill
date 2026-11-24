#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = []
# ///
"""Crea una presentación estática desde un JSON de contenido.
Uso: uv run --script scripts/create_deck.py --content contenido.json --output destino [--force]

Las rutas locales de meta.logos[].src, slides[].image.src y slides[].illustration se resuelven
respecto al JSON de entrada y se incrustan como data URIs Base64. El contenido se valida con
las mismas reglas que validate_deck.py antes de escribir nada.
"""
import argparse
import base64
import json
import mimetypes
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_deck import ILLUSTRATIONS, MAX_FILE_BYTES, TEMPLATE_FILES, validate_content  # noqa: E402

HERE = Path(__file__).resolve().parent.parent
LOGO_TYPES = ('image/png', 'image/jpeg', 'image/webp', 'image/gif')
IMAGE_TYPES = LOGO_TYPES + ('image/svg+xml',)


class ContentError(ValueError):
    pass


def embed(src, base, allowed, what):
    """Devuelve src como data URI Base64. Acepta data URIs ya preparados o rutas locales."""
    if not isinstance(src, str) or not src:
        raise ContentError(f'{what}: src debe ser una ruta o un data URI')
    if src.startswith('data:'):
        return src
    if '://' in src or src.startswith('//'):
        raise ContentError(f'{what}: debe ser un archivo local o un data URI, nunca una URL remota ({src})')
    path = (base / src).resolve()
    mime = mimetypes.guess_type(path.name)[0]
    if mime not in allowed:
        raise ContentError(f'{what}: formato no admitido ({src})')
    if not path.is_file() or path.stat().st_size > MAX_FILE_BYTES:
        raise ContentError(f'{what}: archivo ausente o superior a 5 MiB ({src})')
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def embed_resources(data, base):
    meta = data.get('meta', {})
    logos = meta.get('logos', [])
    if not isinstance(logos, list) or len(logos) > 3:
        raise ContentError('meta.logos debe ser una lista de 0 a 3 elementos')
    for i, logo in enumerate(logos, 1):
        if not isinstance(logo, dict):
            raise ContentError(f'logo {i}: necesita src y alt')
        original = logo.get('src')
        logo['src'] = embed(original, base, LOGO_TYPES, f'logo {i}')
        if not logo.get('alt') and isinstance(original, str) and not original.startswith('data:'):
            logo['alt'] = Path(original).stem
    for i, slide in enumerate(data.get('slides', []), 1):
        if not isinstance(slide, dict):
            continue
        if isinstance(slide.get('image'), dict):
            slide['image']['src'] = embed(slide['image'].get('src'), base, IMAGE_TYPES, f'slide {i} image')
        ill = slide.get('illustration')
        if isinstance(ill, str) and ill not in ILLUSTRATIONS:
            slide['illustration'] = embed(ill, base, IMAGE_TYPES, f'slide {i} illustration')


def json_script(identifier, value):
    payload = json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    return f'<script id="{identifier}" type="application/json">{payload}</script>'


README = """# {title}

Borrador editable de la presentación. **Abre `index.html` directamente** (doble clic): funciona sin servidor web y sin Internet.

- **✎ Editar**: corrige títulos, párrafos, viñetas, destacados y notas directamente sobre la diapositiva.
- **Gestionar**: tamaño de la diapositiva, tema por defecto, logos, ilustración de portada, imagen de cada diapositiva, activar/desactivar diapositivas y JSON del ejercicio.
- **Descargar borrador JSON** guarda los cambios fuera del navegador; para incorporarlos a esta carpeta, regenera con `create_deck.py --content borrador.json --output esta-carpeta --force`.
- **Generar HTML definitivo** descarga un único `.html` autocontenido, sin editor ni diapositivas desactivadas.
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--content', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--force', action='store_true', help='Permitir sobrescribir los ficheros generados')
    a = parser.parse_args()
    try:
        data = json.loads(a.content.read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        parser.error(f'No se pudo leer {a.content}: {e}')
    if not isinstance(data, dict) or not data.get('meta') or not data.get('slides'):
        parser.error('El JSON necesita meta y slides no vacíos')
    try:
        embed_resources(data, a.content.parent)
    except ContentError as e:
        parser.error(str(e))
    errors = validate_content(data)
    if errors:
        parser.error('contenido no válido:\n  - ' + '\n  - '.join(errors))
    targets = list(TEMPLATE_FILES) + ['assets/content.json']
    existing = [t for t in targets if (a.output / t).exists()]
    if existing and not a.force:
        parser.error(f'El archivo {a.output / existing[0]} ya existe. Usa --force para sobrescribir')
    for rel in TEMPLATE_FILES:
        target = a.output / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(HERE / 'assets' / Path(rel).name, target)
    (a.output / 'assets/content.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # Embed the editable source and publication bundle so index.html works from file:// without a server.
    bundle ={'css': (a.output / 'assets/slides.css').read_text(encoding='utf-8'),
              'exercises': (a.output / 'assets/exercises.js').read_text(encoding='utf-8'),
              'slides': (a.output / 'assets/slides.js').read_text(encoding='utf-8')}
    html_path = a.output / 'index.html'
    html = html_path.read_text(encoding='utf-8')
    html = html.replace('</body>', json_script('embedded-deck', data) +
                        json_script('embedded-publish-resources', bundle) + '</body>')
    html_path.write_text(html, encoding='utf-8')
    readme = a.output / 'README.md'
    if not readme.exists():
        readme.write_text(README.format(title=data['meta']['title']), encoding='utf-8')
    print(f'OK: presentación generada en {a.output.resolve()} ({len(data["slides"])} slides)')


if __name__ == '__main__':
    main()
