# Edición in situ y publicación de una versión autónoma

1. Genera la carpeta de borrador con `create_deck.py` y sírvela por HTTP. Pulsa **✎ Editar**.
2. Corrige texto directamente en títulos, párrafos, viñetas o destacados. Al perder foco, el cambio se escribe en el modelo. El panel permite editar texto de campos completos, notas del ponente y JSON del ejercicio.
3. En el selector aparecen **todas** las diapositivas, incluso las desactivadas. Desmarca «Incluir esta diapositiva» para excluirla de navegación, índice y versión final; vuelve a marcar para restaurarla. Se impide ocultar la última activa.
4. Guarda el borrador descargando el JSON. Los cambios también se almacenan automáticamente en `localStorage` del mismo navegador y origen. Para llevar los cambios a otra máquina, importa el JSON o reemplaza `assets/content.json` y regenera.
5. Pulsa **Generar HTML definitivo**. Se descargarán `ID-definitiva.html` con CSS, JavaScript, contenido JSON y HTML en un fichero sin código editor. **Comprueba abriendo el HTML localmente**: debe funcionar incluso desde `file://`, sin red ni carpeta `assets/`.
6. Las diapositivas desactivadas se eliminan del contenido final, no se dejan ocultas. El progreso de ejercicios se identifica por ID en `localStorage`; dependiendo del navegador, `file://` puede limitar esa persistencia, pero no impide la interacción.

## Restricciones técnicas

- El exportador incluido es autocontenido para presentaciones de texto, bullets y ejercicios generados por esta skill. No se debe introducir dependencia externa sin ampliar el exportador para incrustarla.
- Si personalizas CSS o JS, mantenlos en `assets/`; el exportador leerá esos archivos al publicar. No permitas `@import`, `url(...)` remoto o fuentes externas sin incrustar. Los recursos multimedia requieren un convertidor a `data:` o una validación que bloquee publicar.
- `assets/editor.js` y `assets/editor.css` pertenecen solo al borrador y deben ser eliminados, junto a su panel, botones y sus atributos, del HTML publicado.
- El JSON de ejercicios y sus respuestas queda accesible dentro del HTML; nunca usar como sistema de examen seguro.
- Antes de publicar, valida el JSON de los ejercicios (tipo, IDs, opciones, respuestas, tolerancias) con `validate_deck.py` sobre el borrador sincronizado a disco o validación equivalente en el navegador.


## Logotipos y exportación autosuficiente

En el editor, sección «Logotipos», añade o retira hasta tres archivos PNG/JPEG/WebP/GIF (máximo 5 MiB cada uno), configura el texto alternativo y observa el resultado inmediatamente en la cabecera. El navegador convierte cada logo a Base64 al cargarlo. La ausencia total de logos no deja separación. Al exportar se validan los datos y se genera un fichero final con las imágenes embebidas en el JSON; el motor público las reproduce sin editor ni rutas externas. Las imágenes fuente declaradas por ruta en el JSON de entrada se convierten automáticamente con `create_deck.py`.
