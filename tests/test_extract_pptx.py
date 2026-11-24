"""Extracción PPTX real: genera un PPTX con python-pptx (vía uv) y lo inventaría."""
import base64
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from helpers import UV, run_script

PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg=='
BUILD = '''
import base64, sys
from pptx import Presentation
from pptx.util import Inches
prs = Presentation()
s = prs.slides.add_slide(prs.slide_layouts[5])
s.shapes.title.text = "Título de prueba"
open(sys.argv[2], "wb").write(base64.b64decode(sys.argv[3]))
pic = s.shapes.add_picture(sys.argv[2], Inches(1), Inches(2))
pic._element.nvPicPr.cNvPr.set("descr", "Un píxel")
s.notes_slide.notes_text_frame.text = "Notas del ponente"
prs.save(sys.argv[1])
'''


@unittest.skipUnless(UV, 'uv no disponible')
class ExtractTest(unittest.TestCase):
    def test_title_notes_and_images(self):
        with tempfile.TemporaryDirectory() as td:
            folder = Path(td)
            build = subprocess.run([UV, 'run', '--quiet', '--python', '3.12', '--with', 'python-pptx>=1.0.2,<2',
                                    'python', '-c', BUILD, folder / 'clase.pptx', folder / 'px.png', PIXEL],
                                   capture_output=True, text=True)
            if build.returncode:
                self.skipTest('No se pudo preparar python-pptx: ' + build.stderr[-300:])
            res = run_script('extract_pptx.py', folder / 'clase.pptx', '--output', folder / 'extract.json')
            self.assertEqual(res.returncode, 0, res.stderr)
            data = json.loads((folder / 'extract.json').read_text(encoding='utf-8'))
            slide = data['sources'][0]['slides'][0]
            self.assertEqual(slide['title'], 'Título de prueba')
            self.assertEqual(slide['notes'], 'Notas del ponente')
            image = next(s['image'] for s in slide['shapes'] if 'image' in s)
            self.assertEqual(image['alt'], 'Un píxel')
            self.assertTrue(image['supported'])
            self.assertEqual((folder / image['src']).read_bytes(), base64.b64decode(PIXEL))


if __name__ == '__main__':
    unittest.main()
