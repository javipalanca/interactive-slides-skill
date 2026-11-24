# Flujo desde PowerPoint

Comando (siempre con uv, que instala `python-pptx` en un entorno aislado):

```bash
uv run --script scripts/extract_pptx.py clase1.pptx clase2.pptx --output trabajo/extraccion.json
```

Para cada PPTX entrega, por diapositiva: número, `title` (placeholder de título), `hidden` (oculta en el original), `layout` (diseño de PowerPoint), todas las formas (incluidas las de grupos) con su tipo, texto, tablas, enlaces (`links`), datos de gráficos (`chart`: tipo, título, categorías y series con sus valores), texto de los nodos de SmartArt (`smartart`), notas del ponente e imágenes. Las imágenes se guardan en `trabajo/extraccion-media/` (configurable con `--media-dir`) y se listan como `image: {src, alt, content_type, supported}` con `src` relativo al JSON de extracción y el texto alternativo original.

No reproduce el aspecto de SmartArt ni de gráficos, ni las animaciones: con sus datos, recréalos como SVG accesible (con `alt` y, si son datos, también la tabla en el texto o las notas) o notifícalos. Revisa visualmente los ficheros originales. No ejecutes macros ni abras el PPTX en un programa que las ejecute.

Consolidación:

1. Inventariar y ordenar por temario/objetivos, no solo por nombre de archivo.
2. Detectar redundancia y conflictos entre fuentes; mostrar la resolución en un mapa de decisiones.
3. Reutilizar imágenes: guarda `content.json` en la misma carpeta que la extracción para usar los `src` tal cual en `slides[].image.src`. Redacta un `alt` útil cuando el original esté vacío. Las imágenes con `supported: false` (EMF, WMF, TIFF…) deben convertirse a PNG/SVG o recrearse; `create_deck.py` las rechaza.
4. Añadir `source-map.json` con una entrada por slide generada y todas sus fuentes:

   ```json
   [{"slide_id":"agentes","sources":[{"source_file":"modulo1.pptx","source_slide":7},{"source_file":"modulo2.pptx","source_slide":3}],"transformation":"Fusionado y convertido en pregunta guiada"}]
   ```

5. Diapositivas `hidden: true`: el autor las ocultó; consérvalas solo si aportan, y entonces con `disabled: true`. Los `links` son referencias: cítalas en `image.caption`, en el texto o en las notas.
6. Diagramas complejos: reconstruir en SVG semántico o, si se usa imagen, acompañar de alt y transcripción.
7. No tratar como fuente fiable un texto ambiguo extraído de una imagen; verificar o advertir.
8. Mantener backups y no modificar originales salvo orden expresa.
