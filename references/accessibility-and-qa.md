# Accesibilidad y pruebas

- Verificar contraste suficiente **en tema claro y oscuro**, tipografía generosa, controles táctiles y foco visible.
- Animaciones con `prefers-reduced-motion: reduce`, sin destellos y sin pérdida de información al desactivarlas.
- Acciones del teclado nunca deben secuestrar escritura en `input`, `textarea`, `select` o `contenteditable`.
- Feedback de ejercicios en región `aria-live="polite"`; etiquetas asociadas a controles.
- Toda imagen de diapositiva lleva `alt` descriptivo (qué aporta, no «imagen de…»); las ilustraciones de portada son decorativas y se ocultan a lectores de pantalla.
- `Esc` cierra índice y panel de notas; `Tab` permite alcanzar todos los botones.
- El lienzo 16:9 no se desplaza: si el texto no cabe al 85 % del espacio de pantalla, divide la diapositiva. En móvil las diapositivas se apilan.
- Actividades: probar acierto, fallo, reintento, respuesta vacía, persistencia al recargar, mostrar solución, temporizador.
- Probar al menos Chromium y otro motor de navegador, si es posible, tanto escritorio como móvil.
- Abrir borrador y versión definitiva **directamente desde el disco** (`file://`, doble clic), sin servidor web ni red: deben funcionar igual.
- Revisar consola de errores. La validación JSON no sustituye pruebas de navegador.
