# Cómo usar Repaso Cole (guía para papá/mamá)

## 1. La web

- Dirección: **https://carlosmera10.github.io/repaso-cole/**
- En el móvil o la tablet de cada niño: abre la dirección en el navegador → menú → **"Añadir a pantalla de inicio"**. Queda como una app.
- La primera vez, cada uno toca su tarjeta (**Niño** o **Niña**) y con el ✏️ elige su **avatar** y su **curso**.
- El progreso se guarda **en cada dispositivo**. Si un niño usa dos aparatos, cada uno lleva su propio progreso.

### Qué ve cada niño

1. **Inicio:** su porcentaje de avance, el tema que se está dando en clase (🔥) y las asignaturas.
2. **Asignatura:** la lista de temas con su estado: ⚪ sin empezar · 📖 leído · 💪 a repasar · ✅ aprobado · ⭐ dominado (8 o más).
3. **Tema:** primero los **apuntes** y al final el botón **"Hacer el examen"**.
4. **Examen:** una pregunta por pantalla, con la corrección y la explicación al momento. Al terminar ve su nota, las preguntas falladas y puede **repetir solo los fallos**.
5. **Mi progreso:** temas aprobados y dominados, exámenes hechos e historial de notas.

## 2. Crear el proyecto de Claude (una sola vez)

1. En Claude, ve a **Proyectos** → **Crear proyecto** → nombre: *Repaso Cole*.
2. En **Instrucciones**, pega el texto de `proyecto-claude/INSTRUCCIONES_PROYECTO.md` (desde la línea horizontal hacia abajo).
3. En **Conocimiento** (archivos del proyecto), añade el repositorio desde **GitHub** (`Carlosmera10/repaso-cole`). Como mínimo, selecciona la carpeta `proyecto-claude/` y `contenido/indice.json`. Si el repositorio cambia, vuelve a sincronizarlo para que Claude vea la última versión.
4. Si Claude no puede escribir en el repositorio, instala la app de Claude en GitHub dándole acceso solo a `repaso-cole`: https://github.com/apps/claude/installations/select_target

## 3. Peticiones típicas

Escríbelas en un chat **dentro del proyecto**:

- *"Ahora están dando la Prehistoria en Sociales de 5º. Márcalo como 'ahora en clase' y amplía el tema con más preguntas."*
- *"Te paso fotos de las páginas 34 a 41 del libro de Naturales. Rehaz el tema del aparato respiratorio con este contenido."*
- *"Añade a Matemáticas de 6º un tema nuevo de ecuaciones sencillas, después de Estadística."*
- *"El examen del tema de los verbos es muy difícil. Haz preguntas más sencillas."*
- *"Mi hija ha fallado mucho en fracciones. Hazme 20 preguntas nuevas de práctica para ese tema."*
- *"Sube los cambios a GitHub."*

Si el chat puede conectar el repositorio con permiso de escritura, subirá los cambios directamente. Si no, te dará los archivos completos: súbelos en github.com → repositorio → carpeta correspondiente → **Add file** → **Upload files** → **Commit changes**.

## 4. Si cambias de IA

Todo lo necesario está en el propio repositorio:

- `AGENTS.md` / `CLAUDE.md`: instrucciones para cualquier asistente que trabaje con el código.
- `proyecto-claude/GUIA_CONTENIDO.md`: el formato de los temas, con ejemplos.
- `proyecto-claude/PLANTILLA_TEMA.md`: una plantilla para copiar.
- `proyecto-claude/TEMARIO.md`: la lista de temas existentes.

Basta con darle a la otra IA acceso al repositorio (o esos archivos) y las mismas instrucciones.

## 5. Problemas frecuentes

| Problema | Solución |
|---|---|
| La web no se ve tras un cambio | Espera 1-2 minutos (GitHub Pages tarda en publicar) y recarga la página. |
| Sale "No se ha podido cargar el temario" | Revisa la conexión. Si persiste, ejecuta `node herramientas/validar.js`: puede haber un error en `indice.json` (una coma de más o de menos). |
| Un examen no muestra preguntas | Falta la línea `# Examen` o las preguntas no empiezan por `? `. |
| Quiero empezar de cero con un perfil | En **Mi progreso** → abajo del todo → **Borrar mi progreso**. |
