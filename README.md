# interactive-html-slides

Skill portable de creación de presentaciones HTML educativas desde temarios y PowerPoint. Incluye motor de navegación, notas, índice, soluciones, temporizador, ejercicios formativos autocorregibles, persistencia local, plantilla CSS, validadores y extractor PPTX.

## Ejecución autocontenida con uv

Los tres scripts declaran metadatos PEP 723: Python **3.12.x** y sus dependencias por script. `uv` descarga Python si hace falta y prepara un entorno aislado y cacheado, sin ejecutar `pip install` ni alterar el Python del sistema. Requiere tener instalado `uv` y acceso a Internet en la primera ejecución si las versiones no están cacheadas. En macOS/Linux puedes ejecutar directamente `./scripts/create_deck.py ...` (shebang `env -S`), o usar la forma portable `uv run --script scripts/create_deck.py ...`.

## Uso rápido

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output /tmp/mi-curso
uv run --script scripts/validate_deck.py /tmp/mi-curso
```

Abre `/tmp/mi-curso/index.html` directamente. El borrador y el HTML definitivo funcionan offline sin servidor; si el navegador restringe `file://`, sirve la carpeta con `python3 -m http.server 8000 -d /tmp/mi-curso`. El tema visual base usa papel de bloc, crema, naranja y amarillo inspirado en SPADE; las diapositivas se componen a aproximadamente el 85% del ancho visible y ajustan tipografía para evitar desbordarse. Para PPTX: `uv run --script scripts/extract_pptx.py clase.pptx --output /tmp/clase-extract.json`. El JSON extraído es un inventario para que un agente componga el guion, no la presentación final.

Instalación en Codex: copiar esta carpeta a `~/.agents/skills/interactive-html-slides/` o `.agents/skills/interactive-html-slides/`; en Claude Code: `~/.claude/skills/interactive-html-slides/` o `.claude/skills/interactive-html-slides/`. Para compartir, comprimir **la carpeta** entera.

Las presentaciones utilizan el CSS y los componentes del Taller de Skills con las cuatro fuentes incrustadas.

Advertencias: no es plataforma de exámenes seguros; las respuestas están en el navegador. La persistencia utiliza almacenamiento local y puede no funcionar en navegación privada o políticas restrictivas.

Pruebas: `uv run --python 3.12 python -m unittest discover -s tests -v`. Para servir la web también se puede usar `uv run --python 3.12 python -m http.server 8000 -d /tmp/mi-curso`.

## Editor visual y HTML definitivo

La salida generada es un **borrador editable**. Admite **0–3 logos** opcionales en la cabecera, subidos desde el editor o declarados en `meta.logos` del JSON (rutas locales). Cada logo se incrusta como Base64: la versión final no descarga imágenes ni deja hueco cuando no se configura ninguno. Abre `index.html` directamente y pulsa **✎ Editar**. Puedes corregir títulos, párrafos y viñetas directamente sobre el texto; el panel lateral permite editar notas, destacados y ejercicios (JSON). El selector muestra todas las diapositivas y permite **desactivar o reactivar** cada una; las desactivadas no aparecen durante la proyección.

Los cambios se guardan automáticamente en `localStorage`. Para conservarlos fuera del navegador usa **Descargar borrador JSON**; para restaurarlos desde otro equipo utiliza **Importar JSON** o reemplaza `assets/content.json`. La acción **Restaurar contenido original** descarta los cambios locales.

Cuando esté lista, haz clic en **Generar HTML definitivo**: el navegador descarga `ID-definitiva.html`. Este fichero **incluye HTML + CSS + JS + contenido JSON** sin rutas de assets, no contiene el editor y excluye físicamente las slides desactivadas. Puedes abrirlo directamente con doble clic sin servidor ni Internet. Las interacciones y autocorrección siguen funcionando. Los logos PNG/JPEG/WebP/GIF están soportados y embebidos automáticamente (máximo 5 MiB cada uno). Otros multimedia o fuentes externas requieren una ampliación específica.

Ver `references/editing-and-publishing.md` para detalles y límites.
