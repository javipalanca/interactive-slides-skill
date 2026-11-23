# AGENTS.md

Guía para agentes de código que trabajan **en este repositorio** (mantener la skill). Para *usar* la skill y generar presentaciones, las instrucciones están en `SKILL.md`; no dupliques aquí su contenido.

## Qué es

`interactive-html-slides`: una skill portable (Claude Code / Codex) que convierte temarios o PPTX en presentaciones docentes HTML interactivas. El producto tiene dos partes:

1. **Scripts Python** (`scripts/`) que generan, validan y extraen contenido.
2. **Plantilla web** (`assets/`) en HTML/CSS/JS vanilla, sin dependencias ni CDN, que se copia a cada presentación generada.

Todo el texto (docs, mensajes de error, UI, comentarios de cara al usuario) está en **español**. Mantén ese idioma.

## Estructura

| Ruta | Función |
|---|---|
| `SKILL.md` | Punto de entrada de la skill (frontmatter `name`/`description`/`compatibility` + método de trabajo). Es lo que lee el agente que usa la skill. |
| `README.md` | Documentación para humanos. |
| `scripts/create_deck.py` | Copia `assets/` + `content.json` a una carpeta de salida, incrusta logos en Base64 e inyecta `<script id="embedded-deck">` y `<script id="embedded-publish-resources">` en `index.html` para que funcione con `file://`. No sobrescribe sin `--force`. |
| `scripts/validate_deck.py` | Validación estructural de una carpeta generada. Función pública `validate(folder) -> list[str]` (lista vacía = válido). Exit 1 si hay errores. |
| `scripts/extract_pptx.py` | Inventario JSON de uno o varios PPTX (texto, tablas, notas). Única dependencia externa: `python-pptx`. |
| `assets/index.html` | Esqueleto del borrador. Elementos del editor marcados con `editor-control` / `data-editor-asset`. |
| `assets/slides.js` | Motor de ejecución (navegación, render, índice, notas, temporizador, progreso en `localStorage`). Expone `window.SlidesApp` solo para el editor. |
| `assets/exercises.js` | Corrección de ejercicios (`single`, `multiple`, `text`, `number`). |
| `assets/editor.js`, `assets/editor.css` | Capa de edición **solo del borrador**: edición in situ, desactivar slides, logos, importar/exportar JSON y **exportación a HTML definitivo**. |
| `assets/slides.css` | Tema visual con 4 fuentes incrustadas en Base64 (~fichero grande, evita volcarlo entero a la consola). |
| `references/*.md` | Material de consulta que `SKILL.md` cita bajo demanda (esquema, diseño instruccional, ejercicios, PPTX, accesibilidad, personalización, edición/publicación). |
| `references/taller-skills*.html` | Patrón visual canónico (ambos ficheros son idénticos, ~200 KB). |
| `references/fonts/*-OFL.txt` | Licencias de las fuentes incrustadas. No eliminar. |
| `examples/demo-content.json` | Contenido de ejemplo; lo usan los tests. |
| `demo-output/` | Salida generada a partir del ejemplo. **Es un artefacto**: regenérala, no la edites a mano. |
| `tests/` | `unittest` estándar. |

## Comandos

Los scripts declaran metadatos PEP 723 (`requires-python = "==3.12.*"`) y se ejecutan con `uv`; **no uses `pip install`**.

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output /tmp/deck
uv run --script scripts/validate_deck.py /tmp/deck
uv run --script scripts/extract_pptx.py clase.pptx --output /tmp/extract.json
uv run --python 3.12 python -m unittest discover -s tests -v
```

`create_deck.py` y `validate_deck.py` solo usan la biblioteca estándar, así que también funcionan con `python3` directamente (los tests los invocan con `sys.executable`).

Regenerar la demo tras cambiar `assets/` o el ejemplo:

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output demo-output --force
```

(`--force` no borra `demo-output/README.md`, que se conserva si ya existe.)

## Invariantes que no se deben romper

- **Sin red ni dependencias en la web generada**: nada de CDN, `@import`, `url(...)` remotos, fuentes o imágenes externas. Cualquier recurso nuevo debe incrustarse (data URI) o la exportación debe fallar con un error claro.
- **El HTML definitivo es un único fichero** con HTML+CSS+JS+JSON y **sin código del editor**: ni `editor.js`, ni `editor.css`, ni botones/panel ocultos. Las slides con `disabled: true` se eliminan del JSON publicado.
- **Acoplamiento frágil exportador ↔ motor**: `publishedRuntime()` en `assets/editor.js` recorta `assets/slides.js` buscando cadenas literales:
  - `const embedded=document.getElementById('embedded-deck');`
  - `if(!Array.isArray(state.deck.slides)`
  - `window.SlidesApp={` … `init();`
  - `window.dispatchEvent(new CustomEvent('slides:render',`

  Si cambias o reformateas esas líneas en `slides.js`, actualiza `editor.js` a la vez y prueba la exportación.
- **IDs estables**: `slide.id` y `exercise.id` son claves de persistencia en `localStorage`; deben ser únicos.
- **Logos**: 0–3, solo PNG/JPEG/WebP/GIF, ≤ 5 MiB, siempre como `data:image/...;base64,...` en la salida; URLs remotas rechazadas. Sin logos no debe reservarse espacio (`box.hidden=!logos.length` en `slides.js`). Las reglas están replicadas en `create_deck.py`, `validate_deck.py` y `editor.js`: cambia las tres a la vez.
- **Esquema de contenido**: tipos de slide `cover|section|content|exercise|summary`; tipos de ejercicio `single|multiple|text|number`. Si añades uno, actualiza `validate_deck.py` (`TYPES`/`QTYPES`), el render en `slides.js`/`exercises.js`, `references/content-schema.md`, `references/exercise-authoring.md` y, si procede, el ejemplo.
- **Lista de ficheros de la plantilla** repetida en `create_deck.py` (`files`), `validate_deck.py` y `tests/test_validator.py`. Mantenlas sincronizadas.
- Las respuestas de los ejercicios son visibles en el navegador: la autocorrección es **formativa**, no un sistema de examen. No lo presentes de otra forma en la documentación.

## Estilo de código

- Python: biblioteca estándar, `argparse`, `pathlib`, UTF-8 explícito en lecturas/escrituras, mensajes de error en español vía `parser.error(...)`. Conserva la cabecera PEP 723 y el shebang `#!/usr/bin/env -S uv run --script` en cada script.
- JS: vanilla, IIFE con `'use strict'`, sin módulos ni build step, código compacto. Debe funcionar abierto desde `file://`. Respeta accesibilidad: `aria-*`, foco, `prefers-reduced-motion`, y no capturar atajos de teclado cuando el foco está en un campo editable.
- No hay linter ni formateador configurado; sigue el estilo del fichero que tocas.

## Verificación antes de terminar

1. `uv run --python 3.12 python -m unittest discover -s tests -v`.
2. Generar la demo en una carpeta temporal y pasar `validate_deck.py` con 0 errores.
3. Si tocaste `assets/`, regenerar `demo-output/` con `--force` e incluirlo en el commit.
4. Si tocaste el motor o el exportador y dispones de navegador (Playwright/Chromium), abre el borrador por `file://`, pulsa «Generar HTML definitivo» y comprueba que el fichero descargado navega, corrige ejercicios y no contiene `editor`. No afirmes una prueba visual que no hayas hecho.
5. Si cambiaste comportamiento visible para quien usa la skill, actualiza `SKILL.md`, `README.md` y la referencia correspondiente.

## Estado conocido

- `tests/test_logos.py::test_template_has_no_reserved_logo_space` falla actualmente: busca `.presentation-logos:empty{display:none!important}` en `assets/slides.css`, pero el CSS rediseñado usa el selector `#presentationLogos` y ya no contiene esa regla. El ocultado real lo hace el atributo `hidden` desde `slides.js`. Hay que alinear test y CSS (y `references/content-schema.md`, que también menciona `.presentation-logos img`).
