# Accesibilidad y pruebas

- Verificar contraste suficiente, tipografía generosa, controles táctiles y foco visible.
- Animaciones con `prefers-reduced-motion: reduce`, sin destellos y sin pérdida de información al desactivarlas.
- Acciones del teclado nunca deben secuestrar escritura en `input`, `textarea`, `select` o `contenteditable`.
- Feedback de ejercicios en región `aria-live="polite"`; etiquetas asociadas a controles.
- `Esc` cierra índice y panel de notas; `Tab` permite alcanzar todos los botones.
- Slides largas: evitar contenido cortado en pantallas pequeñas; permitir scroll dentro del contenido cuando sea necesario.
- Actividades: probar acierto, fallo, reintento, respuesta vacía, persistencia al recargar, mostrar solución, temporizador.
- Probar al menos Chromium y otro motor de navegador, si es posible, tanto escritorio como móvil.
- Verificar uso offline desde servidor local. `fetch()` de JSON en `file://` suele bloquearse; usar `http://localhost`.
- Revisar consola de errores y 404. La validación JSON no sustituye pruebas de navegador.
