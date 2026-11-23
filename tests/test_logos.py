"""Comprueba que los recursos institucionales son opcionales y quedan embebidos."""
import base64
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIXEL = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==')

class LogosTest(unittest.TestCase):
    def test_zero_to_three_embedded_and_four_rejected(self):
        for count in range(5):
            with self.subTest(count=count), tempfile.TemporaryDirectory() as td:
                folder = Path(td)
                for n in range(count):
                    (folder / f'logo{n}.png').write_bytes(PIXEL)
                deck = json.loads((ROOT/'examples/demo-content.json').read_text())
                deck['meta']['logos'] = [{'src':f'logo{n}.png','alt':f'Logo {n}'} for n in range(count)]
                (folder/'course.json').write_text(json.dumps(deck),encoding='utf-8')
                res = subprocess.run([sys.executable,str(ROOT/'scripts/create_deck.py'),'--content',str(folder/'course.json'),'--output',str(folder/'output')],capture_output=True,text=True)
                if count>3:
                    self.assertNotEqual(res.returncode,0)
                    continue
                self.assertEqual(res.returncode,0,res.stderr)
                result=json.loads((folder/'output/assets/content.json').read_text())
                self.assertEqual(len(result['meta']['logos']),count)
                for logo in result['meta']['logos']:
                    self.assertTrue(logo['src'].startswith('data:image/png;base64,'))
                val=subprocess.run([sys.executable,str(ROOT/'scripts/validate_deck.py'),str(folder/'output')],capture_output=True,text=True)
                self.assertEqual(val.returncode,0,val.stdout+val.stderr)
    def test_template_has_no_reserved_logo_space(self):
        css=(ROOT/'assets/slides.css').read_text()
        self.assertIn('.presentation-logos:empty{display:none!important}',css)
        self.assertIn('box.hidden=!logos.length', (ROOT/'assets/slides.js').read_text())
