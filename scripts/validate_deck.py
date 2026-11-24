#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = []
# ///
"""Valida una presentación generada; exit 0 si válida, exit 1 en errores.
Uso: uv run --script scripts/validate_deck.py ruta_deck

Las reglas de validate_content() están replicadas en deckErrors() de assets/editor.js:
si cambias unas, cambia las otras.
"""
import argparse
import re
import json
from pathlib import Path

TYPES = {'cover', 'section', 'content', 'exercise', 'summary'}
QTYPES = {'single', 'multiple', 'text', 'number'}
LAYOUTS = {'', 'cards', 'split'}
THEMES = {'light', 'dark', 'auto'}
# Ilustraciones de portada incluidas en assets/slides.js (ILLUSTRATIONS) más "none".
ILLUSTRATIONS = {'general', 'ciencia', 'programacion', 'datos', 'agentes', 'matematicas', 'comunicacion', 'none'}
TEMPLATE_FILES = ('index.html', 'assets/slides.css', 'assets/slides.js', 'assets/exercises.js',
                  'assets/editor.css', 'assets/editor.js')
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_DATA_URI = -(-MAX_FILE_BYTES * 4 // 3) + 128
LOGO_URI = re.compile(r'data:image/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}')
IMAGE_URI = re.compile(r'data:image/(?:png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}')


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def _num(value):
    return type(value) in (int, float)


def _data_uri(value, pattern):
    return isinstance(value, str) and len(value) <= MAX_DATA_URI and bool(pattern.fullmatch(value))


def validate_exercise(ex, label):
    errors = []
    if not isinstance(ex, dict):
        return [label + ': exercise debe ser objeto']
    if not _text(ex.get('id')):
        errors.append(label + ': exercise.id vacío')
    qtype = ex.get('type'); ans = ex.get('answer')
    if qtype not in QTYPES:
        return errors + [label + ': tipo de ejercicio no soportado']
    if not _text(ex.get('prompt')):
        errors.append(label + ': prompt ausente')
    if not _text(ex.get('explanation')):
        errors.append(label + ': explanation ausente')
    if qtype in ('single', 'multiple'):
        opts = ex.get('options', [])
        values = [o.get('value') for o in opts if isinstance(o, dict)] if isinstance(opts, list) else []
        if len(values) < 2 or len(values) != len(set(map(str, values))) or any(not isinstance(x, str) for x in values):
            errors.append(label + ': opciones inválidas o duplicadas')
        if not isinstance(opts, list) or any(not isinstance(o, dict) or not o.get('label') for o in opts):
            errors.append(label + ': etiquetas de opciones ausentes')
        if qtype == 'single' and (not isinstance(ans, str) or ans not in values):
            errors.append(label + ': answer debe ser una opción válida')
        if qtype == 'multiple' and (not isinstance(ans, list) or not ans or any(x not in values for x in ans)
                                    or len(set(map(str, ans))) != len(ans)):
            errors.append(label + ': answer debe ser una lista de opciones válidas y únicas')
    elif qtype == 'text':
        if not isinstance(ans, str) and not (isinstance(ans, list) and ans and all(isinstance(x, str) for x in ans)):
            errors.append(label + ': respuesta textual no válida')
    elif qtype == 'number':
        if not _num(ans):
            errors.append(label + ': answer debe ser numérico')
        tolerance = ex.get('tolerance', 0)
        if not _num(tolerance) or tolerance < 0:
            errors.append(label + ': tolerance debe ser numérica y >= 0')
    minutes = ex.get('minutes', 0)
    if not _num(minutes) or minutes < 0:
        errors.append(label + ': minutes debe ser >= 0')
    return errors


def validate_content(deck):
    """Valida el modelo de contenido (dict ya cargado). Devuelve una lista de errores."""
    errors = []
    if not isinstance(deck, dict):
        return ['El JSON raíz debe ser un objeto']
    meta = deck.get('meta', {})
    if not isinstance(meta, dict) or not all(_text(meta.get(k)) for k in ('id', 'title')):
        errors.append('meta.id y meta.title deben ser textos no vacíos')
    meta = meta if isinstance(meta, dict) else {}
    logos = meta.get('logos', [])
    if not isinstance(logos, list) or len(logos) > 3:
        errors.append('meta.logos debe contener entre 0 y 3 logos')
    else:
        for i, logo in enumerate(logos, 1):
            if not isinstance(logo, dict) or not _text(logo.get('alt')) or not _data_uri(logo.get('src'), LOGO_URI):
                errors.append(f'logo {i}: src debe ser Base64 (≤ 5 MiB) y alt texto no vacío')
    if 'theme' in meta and meta['theme'] not in THEMES:
        errors.append('meta.theme debe ser light, dark o auto')
    if 'slideSize' in meta and (not _num(meta['slideSize']) or not 50 <= meta['slideSize'] <= 100):
        errors.append('meta.slideSize debe ser un número entre 50 y 100')
    slides = deck.get('slides')
    if not isinstance(slides, list) or not slides:
        return errors + ['slides debe ser un array no vacío']
    ids = set(); exids = set()
    for i, s in enumerate(slides, 1):
        label = f'slide {i}'
        if not isinstance(s, dict):
            errors.append(label + ': debe ser un objeto'); continue
        sid = s.get('id'); typ = s.get('type')
        if not _text(sid):
            errors.append(label + ': id no válido')
        elif sid in ids:
            errors.append(label + ': id repetido ' + sid)
        else:
            ids.add(sid)
        if not _text(s.get('title')):
            errors.append(label + ': falta title')
        if typ not in TYPES:
            errors.append(label + ': type no válido: ' + str(typ))
        if 'layout' in s and s['layout'] not in LAYOUTS:
            errors.append(label + ': layout no válido: ' + str(s['layout']))
        if 'image' in s:
            img = s['image']
            if (not isinstance(img, dict) or not _text(img.get('alt')) or not _data_uri(img.get('src'), IMAGE_URI)
                    or not isinstance(img.get('caption', ''), str)):
                errors.append(label + ': image necesita src en Base64 (PNG, JPEG, WebP, GIF o SVG; ≤ 5 MiB) y alt no vacío')
        if 'illustration' in s:
            ill = s['illustration']
            if not (isinstance(ill, str) and (ill in ILLUSTRATIONS or _data_uri(ill, IMAGE_URI))):
                errors.append(label + ': illustration debe ser una ilustración incluida, "none" o una imagen en Base64')
        if typ == 'exercise' and not s.get('exercise'):
            errors.append(label + ': exercise obligatorio')
        if not s.get('exercise'):
            continue
        errors += validate_exercise(s['exercise'], label)
        eid = s['exercise'].get('id') if isinstance(s['exercise'], dict) else None
        if _text(eid):
            if eid in exids:
                errors.append(label + ': exercise.id repetido ' + eid)
            else:
                exids.add(eid)
    return errors


def validate(folder):
    """Valida una carpeta de borrador generada por create_deck.py."""
    folder = Path(folder)
    errors = ['Falta ' + name for name in TEMPLATE_FILES + ('assets/content.json',) if not (folder / name).is_file()]
    path = folder / 'assets/content.json'
    if not path.is_file():
        return errors
    try:
        deck = json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, UnicodeError) as e:
        return errors + [f'JSON inválido: {e}']
    return errors + validate_content(deck)


def main():
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('folder', type=Path); a = p.parse_args()
    errors = validate(a.folder)
    for error in errors:
        print('ERROR:', error)
    print('OK: sin errores estructurales.' if not errors else f'{len(errors)} error(es).')
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
