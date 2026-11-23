# Construcción de ejercicios

- **Elección única**: un distractor debe reflejar una confusión real, no una tontería.
- **Elección múltiple**: comunica expresamente «Selecciona todas las respuestas correctas»; evaluación exacta de conjunto.
- **Texto corto**: reservar para respuestas breves con variantes conocidas; la normalización no corrige equivalencias semánticas.
- **Numérico**: define unidades, precisión y tolerancia. Ejemplo: `answer: 9.81`, `tolerance: 0.05`, `unit: m/s²`.
- **Problemas abiertos**: incluye rúbrica, pautas y botón «ver ejemplo de solución»; no los describas como autocorregibles.

Feedback útil: indica por qué se equivocó o cuál es el razonamiento correcto, no solo un indicador de color. Mantén las opciones estables para que una respuesta guardada siga teniendo sentido. Ofrece «Reintentar» y un «Ver solución» independiente del acierto. No almacenes nombres ni correos.

Para cambiar el sistema de puntuación o introducir crédito parcial, modifica `assets/exercises.js` y añade pruebas específicas; no lo prometas sin implementarlo.
