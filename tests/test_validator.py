"""Ejecutar desde la raíz: uv run --python 3.12 python -m unittest discover -s tests -v"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

from helpers import ROOT, run_script

sys.path.insert(0, str(ROOT / 'scripts'))
from validate_deck import TEMPLATE_FILES, validate, validate_content  # noqa: E402

DEMO = ROOT / 'examples/demo-content.json'


def demo():
    return json.loads(DEMO.read_text(encoding='utf-8'))


class TestValidation(unittest.TestCase):
    def generate(self, deck, folder, src_dir=None):
        content = Path(src_dir or folder) / 'course.json'
        content.write_text(json.dumps(deck, ensure_ascii=False), encoding='utf-8')
        return run_script('create_deck.py', '--content', content, '--output', Path(folder) / 'out')

    def test_demo_generates_and_validates(self):
        with tempfile.TemporaryDirectory() as temp:
            res = run_script('create_deck.py', '--content', DEMO, '--output', Path(temp) / 'out')
            self.assertEqual(res.returncode, 0, res.stderr)
            out = Path(temp) / 'out'
            self.assertEqual([], validate(out))
            for name in TEMPLATE_FILES:
                self.assertTrue((out / name).is_file(), name)
            html = (out / 'index.html').read_text(encoding='utf-8')
            self.assertIn('id="embedded-deck"', html)
            self.assertIn('id="embedded-publish-resources"', html)
            d = json.loads((out / 'assets/content.json').read_text(encoding='utf-8'))
            d['slides'][1]['id'] = d['slides'][0]['id']
            (out / 'assets/content.json').write_text(json.dumps(d), encoding='utf-8')
            self.assertTrue(any('repetido' in e for e in validate(out)))

    def test_images_and_illustrations_are_embedded(self):
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp) / 'out'
            res = run_script('create_deck.py', '--content', DEMO, '--output', out)
            self.assertEqual(res.returncode, 0, res.stderr)
            d = json.loads((out / 'assets/content.json').read_text(encoding='utf-8'))
            images = [s['image'] for s in d['slides'] if 'image' in s]
            self.assertTrue(images)
            self.assertTrue(all(i['src'].startswith('data:image/svg+xml;base64,') for i in images))
            self.assertEqual(d['slides'][0]['illustration'], 'ciencia')

    def test_custom_illustration_file(self):
        with tempfile.TemporaryDirectory() as temp:
            d = demo()
            d['slides'] = [s for s in d['slides'] if 'image' not in s]
            (Path(temp) / 'dibujo.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"/>', encoding='utf-8')
            d['slides'][0]['illustration'] = 'dibujo.svg'
            res = self.generate(d, temp)
            self.assertEqual(res.returncode, 0, res.stderr)
            out = json.loads((Path(temp) / 'out/assets/content.json').read_text(encoding='utf-8'))
            self.assertTrue(out['slides'][0]['illustration'].startswith('data:image/svg+xml;base64,'))

    def test_create_deck_rejects_invalid_content_before_writing(self):
        cases = {
            'explanation': lambda d: d['slides'][4]['exercise'].pop('explanation'),
            'remote image': lambda d: d['slides'][3]['image'].update(src='https://example.com/a.png'),
            'image alt': lambda d: d['slides'][3]['image'].update(alt=''),
            'illustration': lambda d: d['slides'][0].update(illustration='inexistente'),
            'theme': lambda d: d['meta'].update(theme='sepia'),
            'slideSize': lambda d: d['meta'].update(slideSize=120),
            'layout': lambda d: d['slides'][3].update(layout='mosaic'),
        }
        for name, mutate in cases.items():
            with self.subTest(name), tempfile.TemporaryDirectory() as temp:
                d = demo()
                d['slides'][3]['image']['src'] = str((ROOT / 'examples' / d['slides'][3]['image']['src']).resolve())
                mutate(d)
                res = self.generate(d, temp)
                self.assertNotEqual(res.returncode, 0, name)
                self.assertFalse((Path(temp) / 'out/index.html').exists(), name)

    def test_validate_content_accepts_meta_options(self):
        d = demo()
        d['slides'] = [s for s in d['slides'] if 'image' not in s]
        for theme in ('light', 'dark', 'auto'):
            d['meta'].update(theme=theme, slideSize=50)
            self.assertEqual([], validate_content(d))


if __name__ == '__main__':
    unittest.main()
