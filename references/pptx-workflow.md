# Flujo desde PowerPoint

Comando: `python3 scripts/extract_pptx.py clase1.pptx clase2.pptx --output extraccion.json` (requiere `python-pptx`).

El extractor entrega para cada PPTX: índice de slide, texto, notas disponibles, títulos aproximados, tablas y tipos de figuras. Puede existir contenido significativo en notas, imágenes, grupos y diagramas. No garantiza extracción de SmartArt ni fidelidad de animaciones. Revisar visualmente los ficheros originales.

Consolidación:

1. Inventariar y ordenar por temario/objetivos, no solo por nombre de archivo.
2. Detectar redundancia y conflictos entre fuentes; mostrar la resolución en un mapa de decisiones.
3. Añadir `source-map.json` para cada slide generada, p. ej. `[{"slide_id":"agentes","sources":[{"source_file":"modulo1.pptx","source_slide":7}],"transformation":"Convertido en pregunta guiada"}]`.
4. Diagramas complejos: reconstruir en SVG semántico o, si se usa imagen, acompañar de alt y transcripción.
5. No tratar como fuente fiable un texto ambiguo extraído de una imagen; verificar o advertir.
6. Mantener backups y no modificar originales salvo orden expresa.
