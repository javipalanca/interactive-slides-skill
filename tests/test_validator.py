"""Ejecutar: python3 -m unittest discover -s tests -v (desde la raíz)."""
import json
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from validate_deck import validate

class TestValidation(unittest.TestCase):
    def test_demo(self):
        root=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as temp:
            from create_deck import HERE
            import shutil
            dest=Path(temp);(dest/'assets').mkdir()
            for name in ('index.html','slides.css','slides.js','exercises.js','editor.css','editor.js'):
                src=HERE/'assets'/name;target=dest/('index.html' if name=='index.html' else 'assets/'+name)
                shutil.copy2(src,target)
            shutil.copy2(root/'examples/demo-content.json',dest/'assets/content.json')
            self.assertEqual([],validate(dest))
            d=json.loads((dest/'assets/content.json').read_text())
            d['slides'][1]['id']=d['slides'][0]['id']
            (dest/'assets/content.json').write_text(json.dumps(d))
            self.assertTrue(any('repetido' in e for e in validate(dest)))
if __name__=='__main__':unittest.main()
