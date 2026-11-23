---
name: interactive-html-slides
description: Diseña, reconstruye y publica presentaciones docentes HTML interactivas, responsivas y accesibles a partir de un temario, apuntes, objetivos de aprendizaje o uno o varios PowerPoint (PPTX). Incluye diapositivas con animaciones progresivas, ejercicios incrustados autocorregibles, notas de ponente, soluciones, temporizadores, progreso persistente, edición visual de contenidos, exclusión de diapositivas y exportación a HTML final totalmente autocontenido. Usar al pedir slides web, clases interactivas, talleres, convertir PowerPoint a HTML o crear actividades evaluables en una presentación.
compatibility: Scripts autocontenidos PEP 723 con uv (Python 3.12.x; python-pptx se instala automáticamente solo para la extracción PPTX). La presentación web funciona sin dependencias ni CDN.
---

# Presentaciones docentes HTML interactivas

Convierte temarios o PPTX existentes en **una experiencia didáctica web autónoma**. Prioriza pedagogía, fidelidad conceptual y funcionamiento real por encima de efectos decorativos. El resultado no es una exportación plana ni un carrusel de imágenes: debe tener DOM semántico, controles operativos y ejercicios ejecutables.

## Entradas y decisión inicial

1. **Temario** (texto, PDF, Markdown, objetivos): diseña un itinerario coherente, orden de conceptos, ejemplos, actividades y evaluación.
2. **Un PPTX**: extrae texto, notas, imágenes y estructura; conserva el contenido correcto y mejora la interactividad. No inventes información ausente.
3. **Varios PPTX**: inventaría todos, detecta duplicados, consolida capítulos y resuelve contradicciones; registra qué diapositivas fuente sustentan cada sección.
4. **Mixto**: emplea el temario como mapa curricular y las presentaciones como fuentes; anota lagunas y discrepancias.

Si faltan audiencia, duración o profundidad, infiere opciones prudentes, declara las suposiciones y sigue adelante. Solicita aclaración solo cuando una decisión imprescindible no puede inferirse. Nunca simules haber leído un PPTX o probado un navegador que no hayas podido examinar.

## Resultado obligatorio

Genera un borrador editable con `index.html`, `assets/slides.css`, `assets/slides.js`, `assets/exercises.js`, `assets/editor.css`, `assets/editor.js`, `assets/content.json`, `README.md`, y, cuando proceda, `source-map.json` y `media/`. Copia como punto de partida los ficheros de esta skill desde `assets/`. No sobrescribas sin necesidad personalizaciones del usuario.

`content.json` contiene `meta` y `slides`, con tipos `cover`, `section`, `content`, `exercise`, `summary`; el esquema funcional está en `references/content-schema.md`. La app de ejemplo está en `examples/demo-content.json`. Para crear una salida inicial ejecuta:

```bash
uv run --script scripts/create_deck.py --content examples/demo-content.json --output /ruta/mi-presentacion
uv run --script scripts/validate_deck.py /ruta/mi-presentacion
python3 -m http.server 8000 -d /ruta/mi-presentacion
```

Los scripts usan `uv run --script` con Python 3.12.x y dependencias aisladas; no ejecutes `pip install` manualmente. `uv` puede descargar Python y bibliotecas la primera vez; informa si el entorno carece de red. En macOS/Linux también admiten `./scripts/nombre.py` por shebang. La última orden sirve la web localmente. No afirmes que un navegador fue probado cuando solo validaste archivos.

## Método de producción

### 1. Inventariar y planificar

- Identifica objetivos medibles, perfil de asistentes, prerrequisitos, duración, idioma y formato (clase, taller, repaso, seminario).
- Para PPTX ejecuta `uv run --script scripts/extract_pptx.py origen1.pptx [origen2.pptx ...] --output extraccion.json`. El script declara `python-pptx` en sus metadatos PEP 723 y uv la instala en un entorno aislado; nunca atribuyas una extracción inexistente.
- Las notas, tablas e imágenes importan; si no se extraen satisfactoriamente, inspecciona el material original por otra vía. Para gráficas complejas, recrea visualizaciones accesibles o preserva imágenes con texto alternativo.
- Aplica `references/instructional-design.md`: alterna explicaciones, ejemplos y práctica; reserva tiempo de realización y revisión.
- Para varias fuentes, conserva trazabilidad y prioriza decisiones pedagógicas explícitas sobre el orden original. No fusiones secciones contradictorias silenciosamente.

### 2. Guion de contenidos

- Una idea principal por diapositiva y títulos que anticipen su conclusión. Evita paredes de texto.
- Organiza capítulos y agenda clicable. Acompaña actividades con objetivo, consigna, duración, criterio de corrección y feedback.
- Define cada diapositiva en `content.json` con `id` estable (importante para persistencia). Admite HTML limitado en campos enriquecidos; no inyectes HTML desde fuentes no confiables.
- Incorpora ejemplos trabajados, contraejemplos y una síntesis final. No sacrifiques explicaciones esenciales solo por reducir slides.
- En PPTX, prepara un `source-map.json` con `slide_id`, `source_file`, `source_slide` y transformaciones relevantes.

### 3. Interacciones y autoevaluación

- Integra ejercicios **dentro** de las diapositivas, no solo enlaces a formularios externos.
- Tipos incluidos: elección única, selección múltiple, respuesta corta normalizada y comprobación numérica con tolerancia. Consulta `references/exercise-authoring.md`.
- Cada ejercicio requiere identificador único, instrucciones inequívocas, respuesta(s) correcta(s), explicación, evaluación reproducible y opción de reintento. Usa `explanation` para dar retroalimentación útil, no solo «correcto/incorrecto».
- **No expongas respuestas en el texto visible** antes de pulsar «Comprobar»; ten en cuenta que la clave estará en JSON/JS local y NO constituye un sistema de examen seguro. Para notas oficiales, usa un backend autenticado.
- Implementa actividades abiertas como práctica con rúbrica orientativa y autoevaluación; no finjas autocorregir ensayos o respuestas semánticas con reglas simples.
- Permite marcar actividades como hechas, mostrar soluciones bajo demanda y registrar respuestas localmente. El progreso no debe desaparecer por cambiar de diapositiva.
- Cuando resulte pertinente, añade temporizador por actividad y marcador global de progreso. El temporizador nunca bloquea el envío por sí solo.

### 4. Diseño y animaciones HTML

- Parte de `assets/slides.css`; personaliza tokens CSS (`--accent`, fuentes, contraste, superficies) conservando una jerarquía visual legible.
- Usa animaciones CSS discretas y progresivas mediante elementos `[data-reveal]`; un clic o flecha avanza primero los elementos pendientes antes de cambiar de diapositiva. Nunca uses animaciones que impidan leer o interactuar.
- Controles: `←/→` anterior/siguiente, `O` índice, `N` notas, `S` mostrar/ocultar solución, `F` pantalla completa, `Esc` cerrar paneles, `Home/End` inicio/final. No captures teclas cuando el foco está en entradas o elementos editables.
- Añade `prefers-reduced-motion`, navegación por foco, etiquetas, mensajes anunciados, tamaño legible y adaptación a móvil/proyector. Ver `references/accessibility-and-qa.md`.
- Evita dependencias de CDN; todo debe funcionar sin red tras servirlo localmente. No añadas vídeos o imágenes remotas sin justificación y atribución.

### 5. Editar, gestionar logos, desactivar diapositivas y publicar una versión definitiva

- Identidad institucional opcional: admite **cero, uno, dos o tres logos** proporcionados por el usuario, en el orden indicado y con textos alternativos. No inventes logos ni dejes huecos vacíos si no se proporcionan. Colócalos en la cabecera respetando transparencia, proporciones y legibilidad; limita dimensiones sin deformación (CSS `object-fit:contain`). Para entradas JSON, usar `meta.logos:[{src,alt}]` con rutas relativas al JSON o data URIs; `create_deck.py` convierte los archivos PNG/JPEG/WebP/GIF (≤5 MiB) a Base64. Desde el editor se pueden subir y quitar logos, que se incorporan al borrador y a la exportación. Rechaza recursos remotos y más de tres logos. Consulta `references/content-schema.md`.
- El borrador HTML debe incluir el botón **«✎ Editar»** y un panel con los campos de contenido, notas, ejercicio JSON y selector de diapositiva. La edición del título, párrafos, viñetas y destacados puede hacerse **directamente sobre la diapositiva** mediante `contenteditable`; los cambios deben actualizar el modelo JSON, no quedarse solo en el DOM.
- Todas las diapositivas se conservan en el borrador; `disabled: true` marca las que no interesan. No basta ocultarlas con CSS: deben desaparecer de la navegación, índices y progreso del alumno. Deben poder reactivarse desde el selector del editor. Nunca dejar el deck sin diapositivas activas.
- Mantén una copia editable del contenido y permite descargar/importar un borrador JSON para que los cambios puedan viajar entre equipos. `localStorage` es una comodidad, **no** la única fuente de respaldo. No sobrescribas el contenido fuente automáticamente.
- El botón **«Generar HTML definitivo»** debe descargar un único `.html` que **integre HTML, CSS, JS y JSON** y funcione al abrirlo sin servidor, sin CDN, sin red ni ficheros adyacentes. Elimina las slides desactivadas del JSON publicado. Conserva navegabilidad, animaciones, índice, notas, ejercicios, soluciones, temporizadores y persistencia de respuestas.
- **Separa completamente el código de edición** (`assets/editor.js`, `assets/editor.css`, botones y panel): no incluirlo en el HTML definitivo, ni siquiera oculto. El HTML final no debe solicitar `assets/content.json` ni usar rutas relativas para recursos funcionales. El motor de ejecución debe reconocer la etiqueta `#embedded-deck` y tomar de ahí el contenido, usando `fetch` solo en el borrador.
- Comprueba la versión final abriéndola como `file://` sin servidor ni Internet y prueba navegación, corrección y que no hay botones/código de edición. Para los 0–3 logos admitidos, el HTML definitivo contiene `data:image/...;base64,...`, tanto en el modelo como al renderizar los `<img>`. Para otras imágenes, vídeos, tipografías o bibliotecas, incrústalos (data URI o elementos inline) o interrumpe la exportación con un error claro: no anuncies «autocontenido» si depende de ficheros externos. El exportador base funciona con el motor y contenido textual proporcionados; otros multimedia distintos de los logos requieren tratamiento específico.
- Los cambios editoriales en preguntas y soluciones deben validarse antes de publicación; cualquier clave de respuestas publicada en el navegador es visible, por lo que las pruebas siguen siendo formativas.

### 6. Generar, comprobar, iterar

- `scripts/create_deck.py`: copia plantilla y contenido, evitando sobrescribir salidas existentes salvo `--force`.
- `scripts/validate_deck.py`: valida JSON, IDs, relaciones entre preguntas y respuestas, archivos y estructura mínima. Corrige errores y repite hasta obtener 0 incidencias.
- Revisa visualmente portada, una slide de texto largo, una sección, cada tipo de ejercicio, índice, notas, soluciones y diseño móvil. Comprueba consola, accesibilidad de teclado, persistencia tras recarga y pantalla completa.
- Haz una prueba de navegación completa y corrige cortes, scroll inesperado, imágenes deformadas y contrastes. No declares validación visual si no dispones de navegador.
- Contrasta el contenido con las fuentes: conceptos, ejemplos, cifras, terminología y referencias. En modo PPTX verifica que no falten temas importantes.

## Criterios de aceptación

1. Presentación autocontenida, navegable con teclado y botones, legible en 16:9 y móvil.
2. Índice navegable, contador, progreso y notas del ponente opcionales.
3. Aparición progresiva con soporte de movimiento reducido; no interrumpe formularios.
4. Ejercicios funcionales con corrección, explicación, reintento y soluciones ocultables.
5. Persistencia de respuestas y tareas completadas mediante `localStorage`, separada por identificador de presentación.
6. Sin bibliotecas ni red obligatorias; archivos locales servidos por HTTP. Sin secretos ni código remoto.
7. Validación estructural aprobada y límites o partes no comprobadas documentados.
8. Contenido alineado con el temario y trazabilidad de fuentes en conversiones PPTX.
9. Borrador editable in situ y desde panel; desactivar/reactivar slides y guardar/importar JSON.
10. Botón de exportación que produce un único HTML definitivo offline, sin CSS/JS de edición y sin slides desactivadas.
11. Admite 0–3 logos de usuario, incrustados en Base64 y sin espacios residuales cuando no haya ninguno.

## Material de consulta (leer según necesidad)

- `references/content-schema.md`: modelo JSON y componentes.
- `references/instructional-design.md`: planificación temporal y estructura docente.
- `references/exercise-authoring.md`: evaluación y feedback.
- `references/pptx-workflow.md`: extracción, reconciliación y trazabilidad.
- `references/accessibility-and-qa.md`: checklist de calidad.
- `references/customization.md`: temas, componentes y despliegue.
- `references/editing-and-publishing.md`: borradores, edición in situ, slides desactivadas y publicación sin dependencias.

## Límites y decisiones importantes

- Este kit genera presentaciones interactivas nuevas **inspiradas en patrones** de la web de referencia, no copia su CSS, HTML ni contenido original.
- El extractor PPTX captura texto, notas y metadatos básicos; no convierte fielmente SmartArt, animaciones ni objetos incrustados. Reconstruye esos elementos o notifícalos.
- La corrección en navegador es formativa: cualquier estudiante puede inspeccionar las respuestas. Para exámenes sumativos usar servidor y autenticación.
- Si `localStorage` está bloqueado, la sesión funciona sin persistencia; informa de ello. No recopiles datos personales ni envíes respuestas a terceros.
- No sacrifiques contenido científico por diseño. Cita fuentes y advierte cuando falte sustento.
