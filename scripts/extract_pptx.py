#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = ["python-pptx>=1.0.2,<2"]
# ///
"""Extrae texto, títulos, tablas, notas e imágenes de uno o varios PPTX.
Uso: uv run --script scripts/extract_pptx.py 1.pptx [2.pptx ...] --output extraccion.json [--media-dir carpeta]

Las imágenes se guardan en --media-dir (por defecto <output>-media/ junto al JSON) y se
referencian con rutas relativas al JSON de salida, listas para usarse como slides[].image.src
si content.json se guarda en la misma carpeta que la extracción.
Dependencia gestionada automáticamente por uv (PEP 723): python-pptx
"""
import argparse
import json
from pathlib import Path

# Formatos que la presentación puede incrustar (ver create_deck.py).
SUPPORTED_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'}


def iter_shapes(shapes):
    """Recorre las formas, entrando en los grupos."""
    for shape in shapes:
        yield shape
        if hasattr(shape, 'shapes'):  # GroupShape
            yield from iter_shapes(shape.shapes)


def describe(shape, slide_no, counter, ctx):
    part = {'name': shape.name, 'type': str(shape.shape_type) if shape.shape_type is not None else 'UNKNOWN'}
    if getattr(shape, 'is_placeholder', False):
        try:
            part['placeholder'] = str(shape.placeholder_format.type)
        except (ValueError, AttributeError):
            pass
    if shape.has_text_frame and shape.text.strip():
        part['text'] = shape.text
    if getattr(shape, 'has_table', False) and shape.has_table:
        part['table'] = [[cell.text for cell in row.cells] for row in shape.table.rows]
    if getattr(shape, 'has_chart', False) and shape.has_chart:
        chart = shape.chart
        part['chart'] = {'type': str(chart.chart_type),
                         'series': [s.name for s in chart.plots[0].series] if len(chart.plots) else []}
    try:
        image = shape.image
    except (AttributeError, ValueError, KeyError):
        image = None
    if image is not None:
        counter[0] += 1
        ext = (image.ext or 'bin').lower()
        target = ctx['media_dir'] / f"{ctx['stem']}-s{slide_no:03d}-{counter[0]:02d}.{ext}"
        target.write_bytes(image.blob)
        try:
            alt = shape._element.xpath('./*[1]/p:cNvPr')[0].get('descr') or ''
        except (IndexError, AttributeError):
            alt = ''
        part['image'] = {'src': target.relative_to(ctx['out_dir']).as_posix() if target.is_relative_to(ctx['out_dir'])
                         else str(target), 'alt': alt, 'content_type': image.content_type,
                         'supported': ext in SUPPORTED_EXT}
    return part


def extract(path, Presentation, ctx):
    prs = Presentation(str(path)); slides = []
    ctx = {**ctx, 'stem': Path(path).stem}
    for i, slide in enumerate(prs.slides, 1):
        counter = [0]
        shapes = [describe(shape, i, counter, ctx) for shape in iter_shapes(slide.shapes)]
        title = ''
        try:
            if slide.shapes.title is not None:
                title = slide.shapes.title.text.strip()
        except (AttributeError, KeyError):
            pass
        notes = ''
        try:
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame is not None:
                notes = slide.notes_slide.notes_text_frame.text
        except (AttributeError, KeyError, ValueError):
            pass
        slides.append({'number': i, 'title': title, 'shapes': shapes, 'notes': notes.strip(),
                       'shape_count': len(shapes), 'image_count': counter[0]})
    return {'source_file': str(path), 'slide_count': len(slides), 'slides': slides}


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('files', type=Path, nargs='+')
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--media-dir', type=Path, help='Carpeta para las imágenes extraídas (por defecto <output>-media)')
    a = p.parse_args()
    try:
        from pptx import Presentation
    except ImportError:
        p.error('Falta python-pptx. Ejecuta con uv run --script para instalar dependencias automáticamente')
    for file in a.files:
        if not file.is_file():
            p.error('No existe ' + str(file))
    out_dir = a.output.resolve().parent
    media_dir = (a.media_dir or a.output.with_name(a.output.stem + '-media')).resolve()
    media_dir.mkdir(parents=True, exist_ok=True)
    ctx = {'out_dir': out_dir, 'media_dir': media_dir}
    result = {'sources': [extract(file, Presentation, ctx) for file in a.files],
              'media_dir': media_dir.relative_to(out_dir).as_posix() if media_dir.is_relative_to(out_dir) else str(media_dir),
              'warning': 'No se extraen animaciones ni SmartArt; los gráficos solo se describen. '
                         'Las imágenes con supported=false (EMF, WMF, TIFF...) deben convertirse a PNG/SVG o recrearse. '
                         'Revisar los PPTX visualmente.'}
    out_dir.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    images = sum(s['image_count'] for src in result['sources'] for s in src['slides'])
    print(f'OK: {len(a.files)} archivo(s), {sum(s["slide_count"] for s in result["sources"])} diapositivas '
          f'y {images} imagen(es) inventariadas en {a.output}')
    if not images:
        try:
            media_dir.rmdir()
        except OSError:
            pass


if __name__ == '__main__':
    main()
