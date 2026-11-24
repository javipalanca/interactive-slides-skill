# Edición in situ y publicación de una versión autónoma

1. Genera la carpeta de borrador con `uv run --script scripts/create_deck.py ...` y **abre `index.html` directamente** (doble clic). No hace falta servidor web: el contenido y los recursos van incrustados.
2. Pulsa **✎ Editar** y corrige directamente sobre la diapositiva títulos, subtítulos, párrafos, viñetas, destacados, código, pies de imagen, enunciados y opciones de ejercicios. Las notas del ponente se editan en el panel de notas (`N`). Cada cambio se escribe en el modelo JSON.
3. Pulsa **Gestionar** para abrir el panel lateral:
   - **Presentación**: tamaño de la diapositiva (porcentaje del espacio de pantalla, 85 % por defecto) y tema por defecto (claro, oscuro o según el sistema).
   - **Logotipos**: hasta tres, con texto alternativo.
   - **Diapositiva**: el selector muestra **todas** las diapositivas, incluso las desactivadas. Desmarca «Incluir esta diapositiva» para excluirla de navegación, índice y versión final; vuelve a marcarla para restaurarla. Se impide ocultar la última activa. En portadas, elige la ilustración incluida o sube una propia. En cualquier diapositiva puedes añadir, sustituir o quitar una imagen, su texto alternativo, su pie y la disposición en dos columnas.
   - **Configuración avanzada (ejercicio)**: JSON del ejercicio; se valida al aplicarlo con las mismas reglas que `validate_deck.py`.
4. Guarda el borrador descargando el JSON. Los cambios también se almacenan automáticamente en `localStorage` del mismo navegador. Para llevarlos a otra máquina, importa el JSON desde el editor o regenera la carpeta con `create_deck.py --content borrador.json --output carpeta --force`. Sustituir solo `assets/content.json` no basta: el contenido va incrustado en `index.html`.
5. Pulsa **Generar HTML definitivo**. El editor valida el contenido y descarga `ID-definitiva.html` con CSS, JavaScript, contenido JSON e imágenes en un fichero, sin código de editor. **Compruébalo abriéndolo directamente**: debe funcionar sin red ni carpeta `assets/`.
6. Las diapositivas desactivadas se eliminan del contenido final, no se dejan ocultas. El progreso de ejercicios y la preferencia de tema se guardan en `localStorage` por ID; dependiendo del navegador, `file://` puede limitar esa persistencia, pero no impide la interacción.

## Restricciones técnicas

- El exportador incluido es autocontenido para texto, viñetas, código, ejercicios, logos, imágenes e ilustraciones. Vídeo, audio u otras bibliotecas no están soportados: no introduzcas dependencias externas sin ampliar el exportador para incrustarlas.
- Si personalizas CSS o JS, mantenlos en `assets/` y regenera el borrador: `create_deck.py` incorpora una copia local para poder publicar desde `file://`. No permitas `@import`, `url(...)` remoto o fuentes externas sin incrustar; el exportador rechaza publicar en ese caso.
- `assets/editor.js` y `assets/editor.css` pertenecen solo al borrador y se eliminan, junto a su panel y sus botones, del HTML publicado.
- El JSON de ejercicios y sus respuestas queda accesible dentro del HTML; nunca usar como sistema de examen seguro.
- Las reglas de validación están replicadas en `scripts/validate_deck.py` y en `assets/editor.js`; el editor las aplica al importar, al aplicar un ejercicio y al publicar.
