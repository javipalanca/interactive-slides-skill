# Tema y despliegue

Personaliza `assets/slides.css` modificando `:root`: `--bg`, `--panel`, `--text`, `--muted`, `--accent`, `--accent-soft`, `--radius` y fuente. El selector `meta.theme` aplica variantes `indigo` (default), `teal`, `magenta`; para otras, añade CSS.

Usa `data-reveal` únicamente para bloques que admiten presentación progresiva. Habilita `reveal:true` por diapositiva; la tecla siguiente muestra primero los bloques ocultos.

Para servir: `python3 -m http.server 8000 -d output`. Para producción, publica la carpeta como archivos estáticos en cualquier servidor HTTPS; comprueba rutas relativas. Para marca universitaria, añade logos propios autorizados y textos alternativos, no marques los logos ajenos como libres.

Extensiones recomendadas solo si lo exige el curso: editor de código embebido sin ejecución arbitraria, simuladores específicos, diagramas SVG interactivos, exportación manual de progreso, analítica únicamente con consentimiento. No presupongas conexión a Internet.
