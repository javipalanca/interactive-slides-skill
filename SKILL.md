---
name: interactive-html-slides
description: Diseña, reconstruye y publica presentaciones docentes HTML interactivas, responsivas y accesibles a partir de un temario, apuntes, objetivos de aprendizaje o uno o varios PowerPoint (PPTX). Incluye diapositivas con el estilo del Taller de Skills, ejercicios incrustados autocorregibles, notas de ponente, soluciones, temporizadores, progreso persistente, edición visual de contenidos, exclusión de diapositivas y exportación a HTML final totalmente autocontenido. Usar al pedir slides web, clases interactivas, talleres, convertir PowerPoint a HTML o crear actividades evaluables en una presentación.
compatibility: Requiere uv (scripts PEP 723 con Python 3.12.x; python-pptx se instala automáticamente solo para la extracción PPTX). La presentación web se abre directamente con doble clic, sin servidor, dependencias ni CDN.
---

# Presentaciones docentes HTML interactivas

Convierte temarios o PPTX existentes en **una experiencia didáctica web autónoma**. Prioriza pedagogía, fidelidad conceptual y funcionamiento real por encima de efectos decorativos. El resultado no es una exportación plana ni un carrusel de imágenes: debe tener DOM semántico, controles operativos y ejercicios ejecutables.

## Entradas y decisión inicial

1. **Temario** (texto, PDF, Markdown, objetivos): diseña un itinerario coherente, orden de conceptos, ejemplos, actividades y evaluación.
2. **Un PPTX**: extrae texto, notas, imágenes y estructura; conserva el contenido correcto y mejora la interactividad. No inventes información ausente.
3. **Varios PPTX**: inventaría todos, detecta duplicados, consolida capítulos y resuelve contradicciones; registra qué diapositivas fuente sustentan cada sección.
4. **Mixto**: emplea el temario como mapa curricular y las presentaciones como fuentes; anota lagunas y discrepancias.

Si faltan audiencia, duración o profundidad, infiere opciones prudentes, declara las suposiciones y sigue adelante. Solicita aclaración solo cuando una decisión imprescindible no puede inferirse. Nunca simules haber leído un PPTX o probado un navegador que no hayas podido examinar.

El patrón visual canónico es references/taller-skills-actual.html. Reutiliza su CSS y componentes de portada, separador, tarjetas, notas e índice, con las cuatro fuentes incrustadas en assets/slides.css.

## Resultado obligatorio

Genera con `create_deck.py` un borrador editable con `index.html`, `assets/slides.css`, `assets/slides.js`, `assets/exercises.js`, `assets/editor.css`, `assets/editor.js`, `assets/content.json` y `README.md`, y, en conversiones PPTX, un `source-map.json`. Las imágenes no se copian a una carpeta `media/` de salida: `create_deck.py` las incrusta en Base64 dentro del contenido. No sobrescribas sin necesidad personalizaciones del usuario.

`content.json` contiene `meta` y `slides`, con tipos `cover`, `section`, `content`, `exercise`, `summary`, imágenes (`image`), ilustración de portada (`illustration`), tema (`meta.theme`) y tamaño (`meta.slideSize`); el esquema funcional está en `references/content-schema.md`. La app de ejemplo está en `examples/demo-content.json`. Para crear una salida inicial ejecuta:

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output /ruta/mi-presentacion
uv run --script scripts/validate_deck.py /ruta/mi-presentacion
```

Ejecuta los scripts **siempre** con `uv run --script` (Python 3.12.x y dependencias aisladas); nunca con `python3` directamente ni con `pip install`. Si `uv` no está instalado, instálalo localmente en el usuario con `curl -LsSf https://astral.sh/uv/install.sh | sh` (Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`) y continúa. `uv` puede descargar Python y bibliotecas la primera vez; informa si el entorno carece de red. La presentación se abre **directamente** haciendo doble clic en `index.html` (`file://`): no levantes ni recomiendes un servidor web. No afirmes que un navegador fue probado cuando solo validaste archivos.

## Método de producción

### 1. Inventariar y planificar

- Identifica objetivos medibles, perfil de asistentes, prerrequisitos, duración, idioma y formato (clase, taller, repaso, seminario).
- Para PPTX ejecuta `uv run --script scripts/extract_pptx.py origen1.pptx [origen2.pptx ...] --output extraccion.json`. Inventaría títulos, textos, tablas, notas y gráficos, y guarda las imágenes en `extraccion-media/` con su texto alternativo original. Nunca atribuyas una extracción inexistente.
- Las notas, tablas e imágenes importan; si no se extraen satisfactoriamente, inspecciona el material original por otra vía. Reutiliza las imágenes relevantes con `image: {src, alt}` (redacta un `alt` útil si el original está vacío); las marcadas `supported: false` (EMF, WMF…) deben convertirse o recrearse. Para gráficas complejas, recrea visualizaciones accesibles en SVG.
- Aplica `references/instructional-design.md`: alterna explicaciones, ejemplos y práctica; reserva tiempo de realización y revisión.
- Decide la **densidad**: *guiada por el docente* (clase o charla en directo: una idea por diapositiva, 1–3 viñetas, más diapositivas) o *de lectura autónoma* (material para repasar sin docente: diapositivas autosuficientes, 4–6 viñetas o tarjetas). Si no se indica, infiere: sesión en directo → guiada; material para estudiar en casa → lectura.
- Para varias fuentes, conserva trazabilidad y prioriza decisiones pedagógicas explícitas sobre el orden original. No fusiones secciones contradictorias silenciosamente.

### 2. Guion de contenidos

- Una idea principal por diapositiva y títulos que anticipen su conclusión. Evita paredes de texto.
- Organiza capítulos y agenda clicable. Acompaña actividades con objetivo, consigna, duración, criterio de corrección y feedback.
- Define cada diapositiva en `content.json` con `id` estable (importante para persistencia). Admite HTML limitado en campos enriquecidos; no inyectes HTML desde fuentes no confiables.
- Incorpora ejemplos trabajados, contraejemplos y una síntesis final. No sacrifiques explicaciones esenciales solo por reducir slides: si no cabe, **divide en más diapositivas**, nunca reduzcas la letra.
- Lo que solo debe saber quien presenta (guion, tiempos, «aquí pregunta a la clase») va en `notes`, nunca en el texto visible. Escribe las notas como **señales**, no como un texto para leer: frases cortas, palabras clave, la transición a la siguiente diapositiva y el tiempo orientativo (ver `references/instructional-design.md`).
- Nunca pongas en una diapositiva texto interno del proceso: nombres de ficheros o plantillas, «opción A», notas de requisitos («tono cercano», «para alumnos de 1.º»), rutas o etiquetas de fuente que no sean citas reales.
- En PPTX, prepara un `source-map.json` con una entrada por slide generada y todas sus fuentes, con el formato de `references/pptx-workflow.md`: `[{"slide_id":"agentes","sources":[{"source_file":"modulo1.pptx","source_slide":7}],"transformation":"Convertido en pregunta guiada"}]`.

### 3. Interacciones y autoevaluación

- Integra ejercicios **dentro** de las diapositivas, no solo enlaces a formularios externos.
- Tipos incluidos: elección única, selección múltiple, respuesta corta normalizada y comprobación numérica con tolerancia. Consulta `references/exercise-authoring.md`.
- Cada ejercicio requiere identificador único, instrucciones inequívocas, respuesta(s) correcta(s), explicación, evaluación reproducible y opción de reintento. Usa `explanation` para dar retroalimentación útil, no solo «correcto/incorrecto».
- **No expongas respuestas en el texto visible** antes de pulsar «Comprobar»; ten en cuenta que la clave estará en JSON/JS local y NO constituye un sistema de examen seguro. Para notas oficiales, usa un backend autenticado.
- Implementa actividades abiertas como práctica con rúbrica orientativa y autoevaluación; no finjas autocorregir ensayos o respuestas semánticas con reglas simples.
- Permite marcar actividades como hechas, mostrar soluciones bajo demanda y registrar respuestas localmente. El progreso no debe desaparecer por cambiar de diapositiva.
- Cuando resulte pertinente, añade temporizador por actividad y marcador global de progreso. El temporizador nunca bloquea el envío por sí solo.

### 4. Diseño y animaciones HTML

- Parte de `assets/slides.css`, con el tema predeterminado de papel crema, cuadrícula de references/taller-skills-actual.html, naranjas y amarillos inspirado en SPADE, y su variante oscura. Cada diapositiva es un lienzo 16:9 de 1280×720 que se ajusta para ocupar `meta.slideSize` % del espacio de pantalla disponible (85 por defecto, 50–100; editable en el panel). El lienzo no se desplaza: si el contenido no cabe, divide la diapositiva.
- Tema: fija `meta.theme` (`light`, `dark` o `auto`) como valor por defecto; el espectador puede alternarlo con el botón de tema o `T`. Comprueba el contraste en ambos temas.
- Portada: elige con `illustration` el dibujo que corresponda al tema de la clase (`general`, `ciencia`, `programacion`, `datos`, `agentes`, `matematicas`, `comunicacion`) o, si ninguno encaja, dibuja un SVG propio adaptado al tema y pásalo como ruta. `none` la omite.
- Imágenes: `image: {src, alt, caption, fit}` con `alt` descriptivo. Diagramas, capturas y gráficos usan `fit: "contain"` (por defecto, nunca recorta); fotografías que deben llenar el marco, `fit: "cover"`. `layout: "split"` para texto e imagen en dos columnas, `layout: "cards"` para viñetas en tarjetas. Si añadir una imagen hace que la diapositiva no quepa, muévela a una diapositiva nueva.
- Muestra todo el texto al entrar. Reserva el movimiento para explicar procesos, como el recorrido de un mensaje o una transición de estado.
- Controles: `←/→` (o deslizar en pantallas táctiles) anterior/siguiente, `O` índice, `N` notas, `P` vista del ponente, `S` mostrar/ocultar solución, `T` tema claro/oscuro, `F` pantalla completa, `Esc` cerrar paneles, `Home/End` inicio/final. La URL lleva `#N` para enlazar a la diapositiva N. Imprimir (`Ctrl/Cmd+P` → Guardar como PDF) genera una página por diapositiva activa en tema claro. No captures teclas cuando el foco está en entradas o elementos editables.
- **Vista del ponente** (`P`): abre una ventana con la diapositiva actual, la siguiente, las notas y un cronómetro, sincronizada con la proyección; pensada para el portátil del docente mientras el proyector muestra la presentación.
- Añade `prefers-reduced-motion`, navegación por foco, etiquetas, mensajes anunciados, tamaño legible y adaptación a móvil/proyector. Ver `references/accessibility-and-qa.md`.
- Evita dependencias de CDN; el borrador y el HTML definitivo deben funcionar sin red ni servidor al abrir sus HTML localmente. No uses imágenes ni vídeos remotos: incrusta las imágenes y atribuye su origen cuando proceda.

### 5. Editar, gestionar logos, desactivar diapositivas y publicar una versión definitiva

- Identidad institucional opcional: admite **cero, uno, dos o tres logos** proporcionados por el usuario, en el orden indicado y con textos alternativos. No inventes logos ni dejes huecos vacíos si no se proporcionan. Se muestran en la barra de navegación inferior respetando transparencia, proporciones y legibilidad; limita dimensiones sin deformación (CSS `object-fit:contain`). Para entradas JSON, usar `meta.logos:[{src,alt}]` con rutas relativas al JSON o data URIs; `create_deck.py` convierte los archivos PNG/JPEG/WebP/GIF (≤5 MiB) a Base64. Desde el editor se pueden subir y quitar logos, que se incorporan al borrador y a la exportación. Rechaza recursos remotos y más de tres logos. Consulta `references/content-schema.md`.
- El borrador HTML incluye el botón **«✎ Editar»** para editar **directamente sobre la diapositiva** (título, subtítulo, párrafos, viñetas, destacados, pies de imagen, enunciados, opciones y notas) y el botón **Gestionar**, que abre el panel lateral con tamaño de diapositiva, tema por defecto, logos, ilustración de portada, imagen de la diapositiva, activación de diapositivas y JSON del ejercicio. Los cambios actualizan el modelo JSON, no solo el DOM.
- Todas las diapositivas se conservan en el borrador; `disabled: true` marca las que no interesan. No basta ocultarlas con CSS: deben desaparecer de la navegación, índices y progreso del alumno. Deben poder reactivarse desde el selector del editor. Nunca dejar el deck sin diapositivas activas.
- Mantén una copia editable del contenido y permite descargar/importar un borrador JSON para que los cambios puedan viajar entre equipos; para incorporarlo a la carpeta, regenera con `create_deck.py --content borrador.json --output carpeta --force` (sustituir solo `assets/content.json` no basta: el contenido va incrustado en `index.html`). `localStorage` es una comodidad, **no** la única fuente de respaldo. No sobrescribas el contenido fuente automáticamente.
- El botón **«Generar HTML definitivo»** debe descargar un único `.html` que **integre HTML, CSS, JS y JSON** y funcione al abrirlo sin servidor, sin CDN, sin red ni ficheros adyacentes. Elimina las slides desactivadas del JSON publicado. Conserva navegabilidad, animaciones, índice, notas, ejercicios, soluciones, temporizadores y persistencia de respuestas.
- **Separa completamente el código de edición** (`assets/editor.js`, `assets/editor.css`, botones y panel): no incluirlo en el HTML definitivo, ni siquiera oculto. El HTML final no debe solicitar `assets/content.json` ni usar rutas relativas para recursos funcionales. Tanto el borrador como el HTML final toman el contenido de la etiqueta `<script id="embedded-deck">`; el motor no usa `fetch`, por eso funciona con `file://`.
- Comprueba la versión final abriéndola como `file://` sin servidor ni Internet y prueba navegación, corrección y que no hay botones/código de edición. Logos, imágenes de diapositiva e ilustraciones propias viajan como `data:image/...;base64,...`. Vídeo, audio u otras bibliotecas no están soportados por el exportador: incrústalos con una ampliación específica o no los uses; no anuncies «autocontenido» si algo depende de ficheros externos.
- Los cambios editoriales en preguntas y soluciones deben validarse antes de publicación; cualquier clave de respuestas publicada en el navegador es visible, por lo que las pruebas siguen siendo formativas.

### 6. Generar, comprobar, iterar

- `scripts/create_deck.py`: incrusta logos, imágenes e ilustraciones, **valida el contenido** y copia la plantilla; no escribe nada si hay errores y no sobrescribe salidas existentes salvo `--force`.
- `scripts/validate_deck.py`: valida JSON, IDs, ejercicios, imágenes, tema, tamaño, archivos y estructura mínima con las mismas reglas que aplica el editor antes de publicar. Corrige errores y repite hasta obtener 0 incidencias.
- En el borrador, pulsa **Gestionar → Revisar desbordamientos** (y atiende la marca «⚠ Desborda» de la barra): el lienzo 16:9 no se desplaza, así que cualquier diapositiva señalada debe dividirse o aligerarse antes de publicar.
- Revisa visualmente, abriendo `index.html` directamente, portada, una slide de texto largo, una con imagen, una sección, cada tipo de ejercicio, índice, notas, soluciones, ambos temas y diseño móvil. Comprueba consola, accesibilidad de teclado, persistencia tras recarga y pantalla completa.
- Haz una prueba de navegación completa y corrige cortes, scroll inesperado, imágenes deformadas y contrastes. No declares validación visual si no dispones de navegador.
- Contrasta el contenido con las fuentes: conceptos, ejemplos, cifras, terminología y referencias. En modo PPTX verifica que no falten temas importantes.

## Criterios de aceptación

1. Presentación autocontenida, navegable con teclado y botones, legible en 16:9 y móvil, que ocupa por defecto el 85 % del espacio de pantalla.
2. Índice navegable, contador, progreso y notas del ponente opcionales.
3. Texto completo desde el primer instante y movimiento didáctico con soporte de movimiento reducido; no interrumpe formularios.
4. Ejercicios funcionales con corrección, explicación, reintento y soluciones ocultables.
5. Persistencia de respuestas y tareas completadas mediante `localStorage`, separada por identificador de presentación.
6. Sin bibliotecas, red ni servidor web: borrador y versión definitiva se abren directamente desde el disco. Sin secretos ni código remoto.
7. Validación estructural aprobada y límites o partes no comprobadas documentados.
8. Contenido alineado con el temario y trazabilidad de fuentes en conversiones PPTX.
9. Borrador editable directamente sobre el texto; desactivar/reactivar slides y guardar/importar JSON.
10. Botón de exportación que produce un único HTML definitivo offline, sin CSS/JS de edición y sin slides desactivadas.
11. Admite 0–3 logos de usuario, incrustados en Base64 y sin espacios residuales cuando no haya ninguno.
12. Imágenes con texto alternativo e ilustración de portada acorde al tema, incrustadas en Base64.
13. Tema claro y oscuro conmutables por el espectador.
14. Ninguna diapositiva activa desborda el lienzo; notas del ponente fuera del texto visible y vista del ponente operativa.
15. Impresión a PDF con una diapositiva por página.

## Material de consulta (leer según necesidad)

- `references/content-schema.md`: modelo JSON y componentes.
- `references/instructional-design.md`: planificación temporal y estructura docente.
- `references/exercise-authoring.md`: evaluación y feedback.
- `references/pptx-workflow.md`: extracción, reconciliación y trazabilidad.
- `references/accessibility-and-qa.md`: checklist de calidad.
- `references/customization.md`: temas, ilustraciones, componentes y distribución.
- `references/editing-and-publishing.md`: borradores, edición in situ, slides desactivadas y publicación sin dependencias.

## Límites y decisiones importantes

- Genera cada presentación con el CSS y los componentes del taller incluidos en la plantilla. Adapta los textos, la ilustración de portada, las imágenes y los ejemplos al tema de la clase.
- El extractor PPTX captura títulos, texto, tablas, notas, enlaces, imágenes, diapositivas ocultas, los datos de los gráficos y el texto de los SmartArt; no reproduce su aspecto ni las animaciones u objetos incrustados. Reconstruye gráficos y SmartArt como SVG con esos datos, o notifícalos. Las diapositivas ocultas del original entran con `disabled: true` si se conservan. Nunca ejecutes macros del PPTX.
- La corrección en navegador es formativa: cualquier estudiante puede inspeccionar las respuestas. Para exámenes sumativos usar servidor y autenticación.
- Si `localStorage` está bloqueado, la sesión funciona sin persistencia; informa de ello. No recopiles datos personales ni envíes respuestas a terceros.
- No sacrifiques contenido científico por diseño. Cita fuentes y advierte cuando falte sustento.
