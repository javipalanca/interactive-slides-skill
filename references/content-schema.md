# Modelo del contenido

`assets/content.json` es UTF-8. Estructura:

```json
{"meta":{"id":"curso-2026","title":"Título","subtitle":"Subtítulo","duration":"90 min","language":"es","theme":"light","slideSize":85},"slides":[{"id":"intro","type":"cover","chapter":"Inicio","title":"Título","subtitle":"Resumen","illustration":"ciencia","notes":"Guion del ponente"},{"id":"concepto","type":"content","chapter":"Bloque 1","eyebrow":"Concepto","title":"Una idea","body":["Párrafo 1","Párrafo 2"],"bullets":["Uno","Dos"]},{"id":"diagrama","type":"content","chapter":"Bloque 1","title":"Cómo funciona","layout":"split","bullets":["Paso 1","Paso 2"],"image":{"src":"media/diagrama.svg","alt":"Diagrama del proceso en dos pasos","caption":"Fuente: elaboración propia"}},{"id":"quiz","type":"exercise","chapter":"Bloque 1","title":"Comprueba tu comprensión","exercise":{"id":"q1","type":"single","prompt":"¿Cuál es correcta?","options":[{"value":"a","label":"A"},{"value":"b","label":"B"}],"answer":"b","explanation":"Porque...","minutes":3}}]}
```

## `meta`

| Campo | Uso |
|---|---|
| `id`, `title` | Obligatorios. `id` identifica la presentación en `localStorage`; `title` aparece en la barra y en la pestaña. |
| `language` | Idioma del documento (`lang`); por defecto `es`. |
| `theme` | Tema por defecto: `light` (por defecto), `dark` o `auto` (sigue al sistema). El espectador puede alternar claro/oscuro con el botón de tema o la tecla `T`; su elección se guarda en `localStorage` (`interactive-theme:<meta.id>`) y prevalece sobre `theme`. |
| `slideSize` | Porcentaje del espacio de pantalla disponible que ocupa la diapositiva 16:9 (50–100, por defecto 85). Editable desde **Gestionar**. |
| `logos` | 0–3 logos (ver más abajo). |
| `subtitle`, `duration` | Informativos para quien prepara la sesión; el motor no los muestra. |

## Diapositivas

Tipos de slide: `cover` (subtitle, illustration), `section` (subtitle), `content` (body como string o array, bullets, callout opcional), `exercise` (exercise obligatorio), `summary` (bullets). Todos admiten:

- `chapter`, `eyebrow`, `notes`, `solution` (texto libre que no se muestra inicialmente).
- `code`: bloque de código preformateado.
- `image`: `{ "src", "alt", "caption"?, "fit"? }`. PNG, JPEG, WebP, GIF o SVG de hasta 5 MiB. `alt` es obligatorio y debe describir lo que aporta la imagen; `caption` es un pie opcional (úsalo para atribuir la fuente). `fit`: `contain` (por defecto: muestra la imagen entera; úsalo en diagramas, capturas, gráficos y logotipos) o `cover` (recorta para llenar el marco; solo fotografías).
- `layout`: `"cards"` muestra las viñetas como tarjetas; `"split"` coloca texto e imagen en dos columnas (requiere `image`).

Las claves `id` deben ser estables y únicas. Todo el texto se inserta como texto plano, no como HTML.

### Ilustración de portada (`illustration`)

Solo se dibuja en slides `cover`. Elige la que corresponda al tema de la clase:

| Valor | Dibujo |
|---|---|
| `general` (por defecto) | Cuaderno abierto con lápiz |
| `ciencia` | Matraz de laboratorio y átomo |
| `programacion` | Ventana de código |
| `datos` | Gráfica de barras con tendencia |
| `agentes` | Carpeta de agente (identidad, buzón, conductas) |
| `matematicas` | Triángulo, π, Σ y x² |
| `comunicacion` | Bocadillos de diálogo |
| `none` | Sin ilustración |

Si ninguna encaja, dibuja un SVG propio adaptado al tema (≈320×270, trazo sencillo, fondo transparente) y pasa su ruta en `illustration`; también se admite PNG/JPEG/WebP/GIF. Las incluidas usan los colores del tema y se adaptan al modo oscuro; una ilustración propia se muestra tal cual, así que elige colores que funcionen en ambos temas.

### Rutas de imágenes

En el JSON de entrada de `create_deck.py`, `image.src`, `illustration` (si no es un nombre de la tabla) y `meta.logos[].src` pueden ser rutas **relativas al propio JSON** o `data:` URI Base64. `create_deck.py` las convierte en `data:image/...;base64,...`, de modo que `assets/content.json` y el HTML definitivo no dependen de ficheros externos. No se admiten URLs remotas.

## Ejercicios

- `single`: `options: [{value,label},...]`, `answer: string`.
- `multiple`: `options`, `answer: [string,...]`; coincide el conjunto completo, sin crédito parcial en el motor base.
- `text`: `answer: string` o array de cadenas aceptadas; compara tras normalizar mayúsculas, espacios y acentos.
- `number`: `answer: number`, `tolerance: number >= 0` (absoluta), `unit` opcional.

Propiedades comunes: `id`, `prompt`, `explanation` (obligatoria), `minutes` (≥ 0, activa el temporizador), `hint`, `solution`.

Las soluciones en JSON son visibles al inspeccionar el código: **no apto para exámenes oficiales**.

## Estado de edición y publicación

Cada slide puede llevar `"disabled": true` para excluirla de la navegación, el progreso y la publicación. En el borrador se conserva con su contenido íntegro. La exportación definitiva elimina esas slides, no solo las oculta con CSS. No desactivar todas las diapositivas. Los identificadores `id` deben permanecer estables para conservar el progreso.

Los cambios hechos desde el editor se guardan en `localStorage` bajo `interactive-editor:<meta.id>` y pueden descargarse como JSON. Para trasladarlos a otro equipo, usa «Descargar borrador JSON» e impórtalo desde el editor, o regenera la carpeta con `create_deck.py --content borrador.json --output carpeta --force`. La exportación definitiva embebe solo slides activas como JSON dentro del HTML; no necesita `content.json` ni archivos externos.

## Logotipos opcionales (máximo tres)

La identidad corporativa se define globalmente mediante `meta.logos` (array opcional, longitud 0–3). Cada elemento tiene `src` y `alt`, en el orden deseado de izquierda a derecha dentro de la barra inferior (a la derecha del capítulo). Si no hay logos, el contenedor `#presentationLogos` lleva el atributo `hidden` y **no ocupa espacio**. El tamaño se controla en `assets/slides.css` con `#presentationLogos img` (máximo 90×34 px, `object-fit: contain`; respeta proporción y transparencias). No estirar ni recortar.

```json
{"meta":{"id":"mi-curso","title":"Mi curso","logos":[{"src":"logos/organizacion.png","alt":"Organización"},{"src":"logos/departamento.webp","alt":"Departamento"}]},"slides":[{"id":"inicio","type":"cover","title":"Inicio"}]}
```

Formatos de logo admitidos: PNG, JPEG, WebP y GIF; límite de 5 MiB por imagen. En el borrador se pueden subir, eliminar y editar sus descripciones desde **Gestionar → Logotipos**. Al descargar el JSON de trabajo quedan incluidos en Base64. El HTML definitivo los conserva en `meta.logos` como `data:` URI. `validate_deck.py` y el exportador verifican el formato y el máximo de tres elementos.
