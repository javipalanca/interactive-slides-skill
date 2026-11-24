# Tema, ilustraciones y distribución

Usa por defecto la plantilla aprobada del Taller de Skills con las fuentes incrustadas Bricolage Grotesque, Source Sans 3, JetBrains Mono y Caveat. Conserva la cuadrícula clara, los acentos naranja, las notas y el índice por capítulos.

- **Tema**: `meta.theme` fija el tema inicial (`light`, `dark`, `auto`). Los colores son variables CSS en `:root` de `assets/slides.css`, con su variante oscura en `[data-theme="dark"]`; si cambias una, cambia también la otra.
- **Tamaño**: `meta.slideSize` (50–100, por defecto 85) es el porcentaje del espacio de pantalla que ocupa la diapositiva.
- **Ilustración de portada**: elige con `illustration` la que corresponda al tema (ver `content-schema.md`) o aporta un SVG propio. Para añadir una ilustración incluida nueva, agrégala a `ILLUSTRATIONS` en `assets/slides.js`, a `ILLUSTRATIONS` en `scripts/validate_deck.py` y a la tabla de `content-schema.md`.
- Muestra todo el texto al entrar en la diapositiva. Reserva el movimiento para explicar procesos.

**Distribución**: el resultado que se entrega es **un único fichero HTML** (`ID-definitiva.html`, generado con «Generar HTML definitivo»). Se abre con doble clic sin servidor ni Internet; puede enviarse por correo, subirse a un aula virtual o alojarse como fichero estático. La carpeta del borrador es material de trabajo, no se publica.

Para marca institucional, añade logos propios autorizados con textos alternativos; no marques los logos ajenos como libres. Atribuye en `image.caption` las imágenes de terceros.

Extensiones recomendadas solo si lo exige el curso: editor de código embebido sin ejecución arbitraria, simuladores específicos, diagramas SVG interactivos, exportación manual de progreso, analítica únicamente con consentimiento. No presupongas conexión a Internet.
