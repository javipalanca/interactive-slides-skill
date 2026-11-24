# interactive-html-slides

Skill portable de creación de presentaciones HTML educativas desde temarios y PowerPoint. Incluye motor de navegación, notas, índice, soluciones, temporizador, ejercicios formativos autocorregibles, persistencia local, tema claro/oscuro, imágenes e ilustraciones incrustadas, plantilla CSS, validadores y extractor PPTX.

## Requisito: uv

Todos los scripts se ejecutan **siempre con [uv](https://docs.astral.sh/uv/)**. Declaran metadatos PEP 723 (Python **3.12.x** y sus dependencias), así que uv descarga Python si hace falta y prepara un entorno aislado y cacheado, sin `pip install` ni tocar el Python del sistema. La primera ejecución necesita Internet si las versiones no están en caché.

Si no tienes uv, instálalo en tu usuario (no requiere permisos de administrador):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

En Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`. En macOS/Linux también puedes ejecutar directamente `./scripts/create_deck.py ...` (shebang `uv run --script`).

## Uso rápido

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output /tmp/mi-curso
uv run --script scripts/validate_deck.py /tmp/mi-curso
```

Abre `/tmp/mi-curso/index.html` **directamente con doble clic**: el borrador y el HTML definitivo funcionan sin servidor web y sin Internet, porque el contenido, el CSS, las fuentes y las imágenes van incrustados.

Para PPTX: `uv run --script scripts/extract_pptx.py clase.pptx --output /tmp/clase-extract.json`. Genera un inventario (títulos, textos, tablas, notas, gráficos descritos) y guarda las imágenes en `/tmp/clase-extract-media/`. Es material para que un agente componga el guion, no la presentación final.

El tema visual base usa papel de bloc, crema, naranja y amarillo inspirado en SPADE, con las cuatro fuentes del Taller de Skills incrustadas. Cada diapositiva es un lienzo 16:9 que ocupa por defecto el **85 % del espacio de pantalla disponible** (configurable entre 50 y 100 %).

Instalación en Codex: copiar esta carpeta a `~/.agents/skills/interactive-html-slides/` o `.agents/skills/interactive-html-slides/`; en Claude Code: `~/.claude/skills/interactive-html-slides/` o `.claude/skills/interactive-html-slides/`. Para compartir, comprimir **la carpeta** entera.

Advertencias: no es plataforma de exámenes seguros; las respuestas están en el navegador. La persistencia utiliza almacenamiento local y puede no funcionar en navegación privada o políticas restrictivas.

Pruebas: `uv run --python 3.12 python -m unittest discover -s tests -v`.

## Contenido visual

- **Imágenes por diapositiva** (`image: {src, alt, caption}`): PNG, JPEG, WebP, GIF o SVG de hasta 5 MiB, con texto alternativo obligatorio. Con `layout: "split"` el texto y la imagen se muestran en dos columnas.
- **Ilustración de portada** (`illustration`): elige la que encaje con el tema de la clase (`general`, `ciencia`, `programacion`, `datos`, `agentes`, `matematicas`, `comunicacion`), `none` para ninguna, o la ruta a un dibujo propio (SVG recomendado).
- **Logos** (`meta.logos`): de 0 a 3 en la barra de navegación; sin logos no queda hueco.
- **Tema** (`meta.theme`): `light`, `dark` o `auto`. Quien ve la presentación puede alternar claro/oscuro con el botón de tema o la tecla `T`; su elección se recuerda en su navegador.

Las rutas locales se resuelven respecto al JSON de contenido y `create_deck.py` las incrusta en Base64. No se admiten URLs remotas.

## Editor visual y HTML definitivo

La salida generada es un **borrador editable**. Abre `index.html` y pulsa **✎ Editar** para corregir directamente sobre la diapositiva títulos, subtítulos, párrafos, viñetas, destacados, pies de imagen, enunciados, opciones y notas del ponente (en el panel de notas).

El botón **Gestionar** abre el panel lateral con:

- **Presentación**: tamaño de la diapositiva (porcentaje del espacio de pantalla, 85 % por defecto) y tema por defecto.
- **Logotipos**: subir, quitar y editar el texto alternativo de 0–3 logos.
- **Diapositiva**: selector con todas las diapositivas, casilla para **desactivar o reactivar** cada una, ilustración de portada (en portadas), imagen de la diapositiva con texto alternativo, pie y disposición en dos columnas, y el JSON del ejercicio (validado al aplicarlo).
- **Acciones**: descargar o importar el borrador JSON, restaurar el contenido original y **Generar HTML definitivo**.

Los cambios se guardan automáticamente en `localStorage`. Para conservarlos fuera del navegador usa **Descargar borrador JSON**; en otro equipo, impórtalo con **Importar JSON…** o regenera la carpeta con `create_deck.py --content borrador.json --output carpeta --force`. **Restaurar contenido original** descarta los cambios locales.

**Generar HTML definitivo** valida el contenido con las mismas reglas que `validate_deck.py` y descarga `ID-definitiva.html`: un único fichero con HTML + CSS + JS + contenido JSON + imágenes, sin editor y sin las diapositivas desactivadas. Se abre con doble clic, sin servidor ni Internet, y conserva navegación, tema, ejercicios y autocorrección.

Ver `references/editing-and-publishing.md` para detalles y límites.
