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
| `scripts/create_deck.py` | Incrusta en Base64 logos, imágenes e ilustraciones propias, valida el contenido con `validate_content()` (no escribe nada si falla), copia `assets/` + `content.json` a la carpeta de salida e inyecta `<script id="embedded-deck">` y `<script id="embedded-publish-resources">` en `index.html` para que funcione con `file://`. No sobrescribe sin `--force`. |
| `scripts/validate_deck.py` | Validación estructural de una carpeta generada. Funciones públicas `validate(folder)` y `validate_content(deck)` → `list[str]` (lista vacía = válido); constantes `TEMPLATE_FILES` e `ILLUSTRATIONS`. Exit 1 si hay errores. |
| `scripts/extract_pptx.py` | Inventario JSON de uno o varios PPTX (títulos, todas las formas incluidas las de grupos, texto, tablas, gráficos descritos, notas) y extracción de imágenes a `<output>-media/`. Única dependencia externa: `python-pptx`. |
| `assets/index.html` | Esqueleto del borrador. Elementos del editor marcados con `editor-control` / `data-editor-asset`. |
| `assets/slides.js` | Motor de ejecución (`buildSlide()` compartido por proyección, vista del ponente e impresión; navegación con teclado, gestos y `#N`; render, ilustraciones de portada `ILLUSTRATIONS`, imágenes, tema claro/oscuro, tamaño `meta.slideSize`, índice, notas, vista del ponente `P`, impresión a PDF, temporizador, progreso en `localStorage`). Lee el contenido solo de `#embedded-deck` (sin `fetch`). Expone `window.SlidesApp` solo para el editor. |
| `assets/exercises.js` | Corrección de ejercicios (`single`, `multiple`, `text`, `number`). |
| `assets/editor.js`, `assets/editor.css` | Capa de edición **solo del borrador**: edición in situ, panel «Gestionar» (tamaño, tema, logos, ilustración, imagen, activar slides, JSON de ejercicio), importar/exportar JSON, validación (`deckErrors`, réplica de `validate_content`) y **exportación a HTML definitivo**. |
| `assets/slides.css` | Tema visual con 4 fuentes incrustadas en Base64 (~fichero grande, evita volcarlo entero a la consola). |
| `references/*.md` | Material de consulta que `SKILL.md` cita bajo demanda (esquema, diseño instruccional, ejercicios, PPTX, accesibilidad, personalización, edición/publicación). |
| `references/taller-skills-actual.html` | Patrón visual canónico (~200 KB). |
| `references/fonts/*-OFL.txt` | Licencias de las fuentes incrustadas. No eliminar. |
| `examples/demo-content.json`, `examples/media/` | Contenido de ejemplo (con imagen SVG e ilustración); lo usan los tests. |
| `demo-output/` | Salida generada a partir del ejemplo. **Es un artefacto**: regenérala, no la edites a mano. |
| `.agents/skills/`, `.claude/skills/` (enlaces), `skills-lock.json` | **Skills de terceros** (frontend-slides, html-ppt, hyperframes, pptx-to-html, storytelling-web) añadidas como material de referencia. No forman parte de la skill distribuida: no las modifiques, no copies su código sin revisar su licencia, y no apliques sus instrucciones (p. ej. `pptx-to-html/CLAUDE.md`, `pip install`, CDN) a este repositorio. |
| `tests/` | `unittest` estándar. `helpers.run_script()` ejecuta los scripts con `uv run --script`. `test_extract_pptx.py` construye un PPTX real con `uv run --with python-pptx`. |

## Comandos

Los scripts declaran metadatos PEP 723 (`requires-python = "==3.12.*"`) y se ejecutan **siempre con `uv`**: nunca `python3 scripts/...` ni `pip install`. Si `uv` no está instalado, instálalo en el usuario con `curl -LsSf https://astral.sh/uv/install.sh | sh`.

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output /tmp/deck
uv run --script scripts/validate_deck.py /tmp/deck
uv run --script scripts/extract_pptx.py clase.pptx --output /tmp/extract.json
uv run --python 3.12 python -m unittest discover -s tests -v
```

Regenerar la demo tras cambiar `assets/` o el ejemplo:

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output demo-output --force
```

(`--force` no sobrescribe `demo-output/README.md`; bórralo antes si cambió el texto de `README` en `create_deck.py`.)

## Invariantes que no se deben romper

- **Se abre sin servidor web**: borrador y HTML definitivo funcionan con doble clic (`file://`). No reintroduzcas `fetch` ni instrucciones de `http.server`.
- **Sin red ni dependencias en la web generada**: nada de CDN, `@import`, `url(...)` remotos, fuentes o imágenes externas. Cualquier recurso nuevo debe incrustarse (data URI) o la exportación debe fallar con un error claro.
- **El HTML definitivo es un único fichero** con HTML+CSS+JS+JSON y **sin código del editor**: ni `editor.js`, ni `editor.css`, ni botones/panel ocultos. Las slides con `disabled: true` se eliminan del JSON publicado.
- **Acoplamiento frágil exportador ↔ motor**: `publishedRuntime()` en `assets/editor.js` recorta `assets/slides.js` buscando cadenas literales:
  - `const embedded=document.getElementById('embedded-deck');`
  - `if(!Array.isArray(state.deck.slides)`
  - `window.SlidesApp={` … `init();`
  - `window.dispatchEvent(new CustomEvent('slides:render',`

  Si cambias o reformateas esas líneas en `slides.js`, actualiza `editor.js` a la vez y prueba la exportación.
- **IDs estables**: `slide.id` y `exercise.id` son claves de persistencia en `localStorage`; deben ser únicos.
- **Validación duplicada**: `validate_content()` en `scripts/validate_deck.py` y `deckErrors()`/`exerciseErrors()` en `assets/editor.js` aplican las mismas reglas con los mismos mensajes. Cambia ambas a la vez.
- **Logos**: 0–3, solo PNG/JPEG/WebP/GIF, ≤ 5 MiB, siempre como `data:image/...;base64,...` en la salida; URLs remotas rechazadas. Sin logos no debe reservarse espacio (`<div id="presentationLogos" hidden>` + `box.hidden=!logos.length` en `slides.js`).
- **Imágenes e ilustraciones**: `image.src` e `illustration` propia admiten además SVG, con el mismo límite de 5 MiB; `image.alt` es obligatorio. La lista de ilustraciones incluidas vive en `ILLUSTRATIONS` de `assets/slides.js` y de `scripts/validate_deck.py` (más `none`); mantenlas iguales y actualiza la tabla de `references/content-schema.md`.
- **Vista del ponente e impresión**: la ventana del ponente se crea con `window.open('')` (about:blank hereda el origen, así funciona con `file://`) y se rellena desde el motor; copia las hojas de estilo y usa `buildSlide()`. La impresión construye `#printDeck` en `beforeprint` y lo elimina en `afterprint`. No dependas de `BroadcastChannel`, iframes con `?preview` ni servidores para estas funciones.
- **Desbordamiento**: el lienzo 1280×720 no se desplaza. El editor detecta `scrollHeight/scrollWidth` mayores que el lienzo (`overflows()` en `editor.js`); no lo sustituyas por reducir la letra automáticamente.
- **Tema y tamaño**: `meta.theme` ∈ `light|dark|auto` (la preferencia del espectador va en `localStorage` `interactive-theme:<id>`); `meta.slideSize` ∈ 50–100, por defecto 85, porcentaje del espacio de pantalla que ocupa el lienzo 1280×720.
- **Esquema de contenido**: tipos de slide `cover|section|content|exercise|summary`; tipos de ejercicio `single|multiple|text|number`. Si añades uno, actualiza `validate_deck.py` (`TYPES`/`QTYPES`), el render en `slides.js`/`exercises.js`, `references/content-schema.md`, `references/exercise-authoring.md` y, si procede, el ejemplo.
- **Lista de ficheros de la plantilla**: `TEMPLATE_FILES` en `validate_deck.py`, que reutilizan `create_deck.py` y los tests.
- Las respuestas de los ejercicios son visibles en el navegador: la autocorrección es **formativa**, no un sistema de examen. No lo presentes de otra forma en la documentación.

## Estilo de código

- Python: biblioteca estándar, `argparse`, `pathlib`, UTF-8 explícito en lecturas/escrituras, mensajes de error en español vía `parser.error(...)`. Conserva la cabecera PEP 723 y el shebang `#!/usr/bin/env -S uv run --script` en cada script.
- JS: vanilla, IIFE con `'use strict'`, sin módulos ni build step, código compacto. Debe funcionar abierto desde `file://`. Respeta accesibilidad: `aria-*`, foco, `prefers-reduced-motion`, y no capturar atajos de teclado cuando el foco está en un campo editable.
- No hay linter ni formateador configurado; sigue el estilo del fichero que tocas.

## Verificación antes de terminar

1. `uv run --python 3.12 python -m unittest discover -s tests -v` (todos en verde).
2. Generar la demo en una carpeta temporal y pasar `validate_deck.py` con 0 errores.
3. Si tocaste `assets/`, regenerar `demo-output/` con `--force` e incluirlo en el commit.
4. Si tocaste el motor o el exportador y dispones de navegador (Playwright/Chromium), abre el borrador por `file://`, pulsa «Generar HTML definitivo» y comprueba que el fichero descargado navega (teclado, gestos, `#N`), muestra imágenes, alterna el tema, abre la vista del ponente, imprime una página por diapositiva, corrige ejercicios y no contiene `editor`. No afirmes una prueba visual que no hayas hecho.
5. Si cambiaste comportamiento visible para quien usa la skill, actualiza `SKILL.md`, `README.md` y la referencia correspondiente.
