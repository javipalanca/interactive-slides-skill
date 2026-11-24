"""Comprueba que los logos son opcionales, quedan embebidos y no reservan espacio."""
import base64
import json
import tempfile
import unittest
from pathlib import Path

from helpers import ROOT, run_script

PIXEL = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==')


class LogosTest(unittest.TestCase):
    def test_zero_to_three_embedded_and_four_rejected(self):
        for count in range(5):
            with self.subTest(count=count), tempfile.TemporaryDirectory() as td:
                folder = Path(td)
                for n in range(count):
                    (folder / f'logo{n}.png').write_bytes(PIXEL)
                deck = json.loads((ROOT / 'examples/demo-content.json').read_text(encoding='utf-8'))
                deck['slides'] = [s for s in deck['slides'] if 'image' not in s]
                deck['meta']['logos'] = [{'src': f'logo{n}.png', 'alt': f'Logo {n}'} for n in range(count)]
                (folder / 'course.json').write_text(json.dumps(deck), encoding='utf-8')
                res = run_script('create_deck.py', '--content', folder / 'course.json', '--output', folder / 'output')
                if count > 3:
                    self.assertNotEqual(res.returncode, 0)
                    continue
                self.assertEqual(res.returncode, 0, res.stderr)
                result = json.loads((folder / 'output/assets/content.json').read_text(encoding='utf-8'))
                self.assertEqual(len(result['meta']['logos']), count)
                for logo in result['meta']['logos']:
                    self.assertTrue(logo['src'].startswith('data:image/png;base64,'))
                val = run_script('validate_deck.py', folder / 'output')
                self.assertEqual(val.returncode, 0, val.stdout + val.stderr)

    def test_template_has_no_reserved_logo_space(self):
        # Documentado en references/content-schema.md: contenedor #presentationLogos oculto con
        # el atributo hidden cuando no hay logos, e imágenes con object-fit:contain.
        css = (ROOT / 'assets/slides.css').read_text(encoding='utf-8')
        self.assertIn('[hidden]{display:none!important}', css)
        self.assertIn('#presentationLogos img{max-width:90px;max-height:34px;object-fit:contain}', css)
        self.assertIn('<div id="presentationLogos" hidden>', (ROOT / 'assets/index.html').read_text(encoding='utf-8'))
        self.assertIn('box.hidden=!logos.length', (ROOT / 'assets/slides.js').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
