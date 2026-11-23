# Modelo del contenido

`assets/content.json` es UTF-8. Estructura:

```json
{"meta":{"id":"curso-2026","title":"Título","subtitle":"Subtítulo","duration":"90 min","language":"es","theme":"indigo"},"slides":[{"id":"intro","type":"cover","chapter":"Inicio","title":"Título","subtitle":"Resumen","notes":"Guion del ponente"},{"id":"concepto","type":"content","chapter":"Bloque 1","eyebrow":"Concepto","title":"Una idea","body":["Párrafo 1","Párrafo 2"],"bullets":["Uno","Dos"],"reveal":true},{"id":"quiz","type":"exercise","chapter":"Bloque 1","title":"Comprueba tu comprensión","exercise":{"id":"q1","type":"single","prompt":"¿Cuál es correcta?","options":[{"value":"a","label":"A"},{"value":"b","label":"B"}],"answer":"b","explanation":"Porque...","minutes":3}}]}
```

Tipos de slide: `cover` (subtitle), `section` (subtitle), `content` (body como string o array, bullets, callout opcional), `exercise` (exercise obligatorio), `summary` (bullets). Todos admiten `notes`, `chapter`, `eyebrow`, `reveal`, `solution`. Las claves `id` deben ser estables y únicas.

Ejercicios:

- `single`: `options: [{value,label},...]`, `answer: string`.
- `multiple`: `options`, `answer: [string,...]`; coincide el conjunto completo, sin crédito parcial en el motor base.
- `text`: `answer: string` o array de cadenas aceptadas; compara tras normalizar mayúsculas, espacios y acentos.
- `number`: `answer: number`, `tolerance: number >= 0` (absoluta), `unit` opcional.

Propiedades comunes: `id`, `prompt`, `explanation`, `minutes`, `hint`, `solution`. `solution` de diapositiva puede ser texto libre; no se muestra inicialmente. Evita incluir fragmentos HTML arbitrarios en las entradas.

Las soluciones en JSON son visibles al inspeccionar el código: **no apto para exámenes oficiales**.

## Estado de edición y publicación

Cada slide puede llevar `"disabled": true` para excluirla de la navegación, el progreso y la publicación. En el borrador se conserva con su contenido íntegro. La exportación definitiva elimina esas slides, no solo las oculta con CSS. No desactivar todas las diapositivas. Los identificadores `id` deben permanecer estables para conservar el progreso.

Los cambios hechos desde el editor se guardan en `localStorage` bajo `interactive-editor:<meta.id>` y pueden descargarse como JSON. Para trasladarlos a otro equipo, usar «Descargar borrador JSON» e importarlo desde el editor, o sustituir `assets/content.json`. La exportación definitiva embebe solo slides activas como JSON dentro del HTML; no necesita `content.json` ni archivos externos.


## Logotipos opcionales (máximo tres)

La identidad corporativa se define globalmente mediante `meta.logos` (array opcional, longitud 0–3). Cada elemento tiene `src` y `alt`, en el orden deseado de izquierda a derecha dentro de la cabecera (a la derecha del capítulo). Si no hay logos, **no se renderiza espacio ni contenedor visible**. El tamaño se controla en `assets/slides.css` con `.presentation-logos img` (altura y anchura máximas, `object-fit: contain`; respeta proporción y transparencias). No estirar ni recortar.

Entrada JSON para generación desde archivos locales (rutas relativas a la ubicación del JSON):

```json
{"meta":{"id":"mi-curso","title":"Mi curso","logos":[{"src":"logos/organizacion.png","alt":"Organización"},{"src":"logos/departamento.webp","alt":"Departamento"}]},"slides":[{"id":"inicio","type":"cover","title":"Inicio"}]}
```

`create_deck.py` incorpora esas imágenes como `data:image/...;base64,...` al contenido generado. Formatos admitidos: PNG, JPEG, WebP y GIF; límite de 5 MiB por imagen. También se admiten `data:` URI Base64 ya preparados. No se admiten URLs externas (rompen la portabilidad). En el borrador HTML se pueden subir, eliminar y editar sus descripciones desde **✎ Editar → Logotipos**. Al descargar el JSON de trabajo quedan incluidos en Base64.

El HTML definitivo conserva los logos en `meta.logos` como `data:` URI y los renderiza desde ese dato, sin solicitar ningún archivo adicional. `validate_deck.py` y el exportador verifican el formato y el máximo de tres elementos.
