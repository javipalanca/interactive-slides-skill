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

DIAGRAM_URIS = ('http://schemas.openxmlformats.org/drawingml/2006/diagram',
                'http://schemas.microsoft.com/office/drawing/2008/diagram')
NS_A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
NS_R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

# Formatos que la presentación puede incrustar (ver create_deck.py).
SUPPORTED_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'}


def iter_shapes(shapes):
    """Recorre las formas, entrando en los grupos."""
    for shape in shapes:
        yield shape
        if hasattr(shape, 'shapes'):  # GroupShape
            yield from iter_shapes(shape.shapes)


def smartart_text(shape, slide):
    """Textos de los nodos de un SmartArt (sin su disposición visual), o None si no es SmartArt."""
    data = shape._element.find('.//' + NS_A + 'graphicData')
    if data is None or data.get('uri') not in DIAGRAM_URIS:
        return None
    rel_ids = next((el for el in data.iter() if el.tag.endswith('}relIds')), None)
    rid = rel_ids.get(NS_R + 'dm') if rel_ids is not None else None
    if not rid:
        return []
    from lxml import etree
    root = etree.fromstring(slide.part.related_part(rid).blob)
    nodes = []
    for pt in root.iter('{*}pt'):
        text = ''.join(t.text or '' for t in pt.iter(NS_A + 't')).strip()
        if text:
            nodes.append(text)
    return nodes


def chart_data(chart):
    plot = chart.plots[0] if len(chart.plots) else None
    data = {'type': str(chart.chart_type), 'title': '', 'categories': [], 'series': []}
    try:
        if chart.has_title and chart.chart_title.has_text_frame:
            data['title'] = chart.chart_title.text_frame.text
    except (AttributeError, KeyError, ValueError):
        pass
    if plot is not None:
        try:
            data['categories'] = [str(c) for c in plot.categories]
        except (AttributeError, KeyError, ValueError):
            pass
        for series in plot.series:
            try:
                values = list(series.values)
            except (AttributeError, KeyError, ValueError):
                values = []
            data['series'].append({'name': series.name, 'values': values})
    return data


def hyperlinks(shape):
    links = []
    if shape.has_text_frame:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                address = run.hyperlink.address if run.hyperlink is not None else None
                if address:
                    links.append({'text': run.text, 'url': address})
    try:
        address = shape.click_action.hyperlink.address
        if address:
            links.append({'text': shape.name, 'url': address})
    except (AttributeError, KeyError, ValueError, TypeError):  # los grupos no admiten click_action
        pass
    return links


def describe(shape, slide_no, counter, ctx, slide):
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
        part['chart'] = chart_data(shape.chart)
    try:
        nodes = smartart_text(shape, slide)
    except (AttributeError, KeyError, ValueError, ImportError):
        nodes = None
    if nodes is not None:
        part['smartart'] = nodes
    links = hyperlinks(shape)
    if links:
        part['links'] = links
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
        shapes = []
        for shape in iter_shapes(slide.shapes):
            try:
                shapes.append(describe(shape, i, counter, ctx, slide))
            except Exception as e:  # una forma problemática no debe detener la extracción
                shapes.append({'name': getattr(shape, 'name', '?'), 'error': f'{type(e).__name__}: {e}'})
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
        slides.append({'number': i, 'title': title, 'hidden': slide._element.get('show') == '0',
                       'layout': slide.slide_layout.name, 'shapes': shapes, 'notes': notes.strip(),
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
              'warning': 'No se extraen animaciones; de los SmartArt solo el texto de sus nodos y de los gráficos '
                         'sus datos (categorías y series), no su aspecto. Las diapositivas hidden=true estaban ocultas. '
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
