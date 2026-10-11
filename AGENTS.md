# Instrucciones para asistentes de IA (Claude, Codex, Gemini, Copilot…)

Este repositorio es **Repaso Cole**: una web estática (HTML + CSS + JavaScript sin dependencias) con apuntes y exámenes de **5º y 6º de Primaria** (currículo LOMLOE, Comunidad de Madrid) para que dos niños repasen en el móvil. Se publica con **GitHub Pages** desde la rama `main`: https://carlosmera10.github.io/repaso-cole/

## Lo más importante

1. **Cada tema = apuntes + examen**, en un solo archivo Markdown dentro de `contenido/<curso>/<asignatura>/`. El formato exacto está en [`proyecto-claude/GUIA_CONTENIDO.md`](proyecto-claude/GUIA_CONTENIDO.md). Léelo antes de escribir contenido.
2. El catálogo de temas es `contenido/indice.json`. **No cambies nunca el `id` de un tema existente**: el progreso de los niños se guarda con ese id en su navegador.
3. La lista `"ahora"` del índice marca los temas que se están dando en clase.
4. Todo el contenido va en **español de España**, adaptado a niños de 10-12 años (en Inglés: explicaciones en español, ejemplos en inglés).
5. **Sin datos personales**: el repositorio es público.

## Comandos

```bash
node herramientas/validar.js   # comprueba índice, archivos, preguntas e imágenes (debe dar 0 errores)
node herramientas/temario.js   # regenera proyecto-claude/TEMARIO.md
python3 -m http.server 8000    # prueba local en http://localhost:8000
```

No hay paso de compilación ni dependencias que instalar. Node solo se usa para las herramientas.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Página única. Carga `js/formato.js` y `js/app.js`. |
| `js/formato.js` | Parser del formato de los temas (Markdown reducido + examen). Funciona en navegador y en Node. |
| `js/app.js` | Interfaz: perfiles, inicio, asignaturas, apuntes, examen, resultados y progreso (localStorage, clave `repasoCole.v1`). Rutas con `#/`. |
| `css/estilos.css` | Estilos, modo claro/oscuro, diseño móvil primero. |
| `contenido/indice.json` | Catálogo: cursos, asignaturas (con color y emoji), temas y lista `ahora`. |
| `contenido/5/…`, `contenido/6/…` | Un `.md` por tema. |
| `img/` | Esquemas SVG (fondo blanco, texto ≥ 14 px). |
| `herramientas/` | Validador y generador del temario. |
| `proyecto-claude/` | Documentación para el proyecto de Claude y para el padre. |

## Flujo de trabajo para un cambio de contenido

1. Lee `proyecto-claude/GUIA_CONTENIDO.md` y `proyecto-claude/TEMARIO.md`.
2. Crea o edita el `.md` del tema; si es nuevo, añádelo a `contenido/indice.json` en el orden correcto.
3. `node herramientas/validar.js` → 0 errores. Revisa a mano los cálculos de Matemáticas.
4. `node herramientas/temario.js`.
5. Commit en español, descriptivo (p. ej. *"Naturales 5º: amplía el sistema circulatorio con 10 preguntas"*), y push a `main`.

## Cambios en el código

Solo si el usuario lo pide. Mantén: sin dependencias externas (salvo Google Fonts), compatibilidad con navegadores móviles, todas las rutas relativas (la web vive en `/repaso-cole/`), y el formato de `localStorage` compatible hacia atrás (no pierdas el progreso guardado).
