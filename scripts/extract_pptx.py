#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = ["python-pptx>=1.0.2,<2"]
# ///
"""Extrae texto, notas y estructura básica de uno o varios PPTX.
Uso: uv run --script scripts/extract_pptx.py 1.pptx [2.pptx ...] --output extraccion.json
Dependencia gestionada automáticamente por uv (PEP 723): python-pptx
"""
import argparse
import json
from pathlib import Path

def extract(path,Presentation):
    prs=Presentation(str(path));slides=[]
    for i,slide in enumerate(prs.slides,1):
        shapes=[]
        for shape in slide.shapes:
            part={'name':shape.name,'type':str(shape.shape_type)}
            if shape.has_text_frame:part['text']=shape.text
            if shape.has_table:part['table']=[[cell.text for cell in row.cells] for row in shape.table.rows]
            if 'text' in part or 'table' in part:shapes.append(part)
        notes=''
        try:
            if slide.has_notes_slide:
                notes='\n'.join(shape.text for shape in slide.notes_slide.shapes if shape.has_text_frame and not shape.is_placeholder)
                # Notes placeholder can contain actual speaker notes; include it explicitly.
                for shape in slide.notes_slide.shapes:
                    if shape.is_placeholder and shape.has_text_frame:
                        try:
                            if shape.placeholder_format.type==2:notes+='\n'+shape.text
                        except (ValueError,AttributeError):pass
        except (AttributeError,KeyError,ValueError):pass
        slides.append({'number':i,'shapes':shapes,'notes':notes.strip(),'shape_count':len(slide.shapes)})
    return {'source_file':str(path),'slide_count':len(slides),'slides':slides}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('files',type=Path,nargs='+');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    try:from pptx import Presentation
    except ImportError: p.error('Falta python-pptx. Ejecuta con uv run --script para instalar dependencias automáticamente')
    for file in a.files:
        if not file.is_file():p.error('No existe '+str(file))
    result={'sources':[extract(file,Presentation) for file in a.files], 'warning':'No se extraen animaciones, SmartArt ni medios embebidos. Revisar los PPTX visualmente.'}
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'OK: {len(a.files)} archivo(s), {sum(s["slide_count"] for s in result["sources"])} diapositivas inventariadas en {a.output}')
if __name__=='__main__':main()
