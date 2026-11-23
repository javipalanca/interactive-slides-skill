#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = []
# ///
"""Valida una presentación generada; exit 0 si válida, exit 1 en errores.
Uso: uv run --script scripts/validate_deck.py ruta_deck
"""
import argparse
import re
import json
from pathlib import Path

TYPES = {'cover','section','content','exercise','summary'}
QTYPES = {'single','multiple','text','number'}

def validate(folder):
    errors=[]
    for name in ('index.html','assets/slides.css','assets/slides.js','assets/exercises.js','assets/editor.css','assets/editor.js','assets/content.json'):
        if not (folder/name).is_file(): errors.append('Falta '+name)
    path=folder/'assets/content.json'
    if not path.is_file(): return errors
    try: deck=json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, UnicodeError) as e: return errors+[f'JSON inválido: {e}']
    if not isinstance(deck,dict): return errors+['El JSON raíz debe ser un objeto']
    meta=deck.get('meta',{})
    if not isinstance(meta,dict) or not all(isinstance(meta.get(k),str) and meta[k].strip() for k in ('id','title')):errors.append('meta.id y meta.title deben ser textos no vacíos')
    logos=meta.get('logos',[]) if isinstance(meta,dict) else []
    if not isinstance(logos,list) or len(logos)>3:errors.append('meta.logos debe contener entre 0 y 3 logos')
    else:
        for i,logo in enumerate(logos,1):
            if not isinstance(logo,dict) or not isinstance(logo.get('alt'),str) or not logo['alt'].strip() or not isinstance(logo.get('src'),str) or not re.fullmatch(r'data:image/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}',logo['src']):
                errors.append(f'logo {i}: src debe ser Base64 y alt texto no vacío')
    slides=deck.get('slides')
    if not isinstance(slides,list) or not slides:return errors+['slides debe ser un array no vacío']
    ids=set(); exids=set()
    for i,s in enumerate(slides,1):
        label=f'slide {i}'
        if not isinstance(s,dict):errors.append(label+': debe ser un objeto');continue
        sid=s.get('id');typ=s.get('type')
        if not isinstance(sid,str) or not sid.strip():errors.append(label+': id no válido')
        elif sid in ids:errors.append(label+': id repetido '+sid)
        else:ids.add(sid)
        if not isinstance(s.get('title'),str) or not s['title'].strip():errors.append(label+': falta title')
        if typ not in TYPES:errors.append(label+': type no válido: '+str(typ))
        if typ=='exercise' and not s.get('exercise'):errors.append(label+': exercise obligatorio')
        if not s.get('exercise'):continue
        ex=s['exercise'];eid=ex.get('id') if isinstance(ex,dict) else None
        if not isinstance(ex,dict):errors.append(label+': exercise debe ser objeto');continue
        if not isinstance(eid,str) or not eid:errors.append(label+': exercise.id vacío')
        elif eid in exids:errors.append(label+': exercise.id repetido '+eid)
        else:exids.add(eid)
        qtype=ex.get('type');ans=ex.get('answer')
        if qtype not in QTYPES:errors.append(label+': tipo de ejercicio no soportado');continue
        if not isinstance(ex.get('prompt'),str) or not ex['prompt'].strip():errors.append(label+': prompt ausente')
        if not isinstance(ex.get('explanation'),str) or not ex['explanation'].strip():errors.append(label+': explanation ausente')
        if qtype in ('single','multiple'):
            opts=ex.get('options',[])
            values=[o.get('value') for o in opts if isinstance(o,dict)] if isinstance(opts,list) else []
            if len(values)<2 or len(values)!=len(set(values)) or any(not isinstance(x,str) for x in values):errors.append(label+': opciones inválidas o duplicadas')
            if not isinstance(opts,list) or any(not isinstance(o,dict) or not o.get('label') for o in opts):errors.append(label+': etiquetas de opciones ausentes')
            answers=ans if isinstance(ans,list) else [ans]
            if qtype=='single' and (not isinstance(ans,str) or ans not in values):errors.append(label+': answer debe ser una opción válida')
            if qtype=='multiple' and (not isinstance(ans,list) or not ans or any(x not in values for x in ans) or len(set(ans))!=len(ans)):errors.append(label+': answer debe ser una lista de opciones válidas y únicas')
        elif qtype=='text' and (not isinstance(ans,str) and not (isinstance(ans,list) and ans and all(isinstance(x,str) for x in ans))):errors.append(label+': respuesta textual no válida')
        elif qtype=='number':
            if type(ans) not in (float,int):errors.append(label+': answer debe ser numérico')
            tolerance=ex.get('tolerance',0)
            if type(tolerance) not in (float,int) or tolerance<0:errors.append(label+': tolerance debe ser numérica y >= 0')
        minutes=ex.get('minutes',0)
        if type(minutes) not in (float,int) or minutes<0:errors.append(label+': minutes debe ser >= 0')
    return errors

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args()
    errors=validate(a.folder)
    for error in errors:print('ERROR:',error)
    print('OK: sin errores estructurales.' if not errors else f'{len(errors)} error(es).')
    raise SystemExit(bool(errors))
if __name__=='__main__':main()
