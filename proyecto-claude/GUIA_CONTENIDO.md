# Guía de contenido de Repaso Cole

Esta guía explica **cómo están hechos los temas** y **cómo escribir uno nuevo**. La deben seguir tanto las personas como cualquier IA (Claude u otra) que edite el repositorio.

---

## 1. Dónde está cada cosa

```
repaso-cole/
├── index.html                  ← la web (no hace falta tocarla para añadir temas)
├── css/estilos.css             ← diseño
├── js/app.js                   ← funcionamiento: perfiles, progreso, exámenes
├── js/formato.js               ← lee los archivos .md de los temas
├── img/                        ← imágenes y esquemas (SVG o PNG)
├── contenido/
│   ├── indice.json             ← CATÁLOGO: lista de asignaturas y temas, y "ahora en clase"
│   ├── 5/<asignatura>/NN-nombre.md
│   └── 6/<asignatura>/NN-nombre.md
├── herramientas/validar.js     ← comprueba que todo está bien escrito
├── herramientas/temario.js     ← regenera proyecto-claude/TEMARIO.md
└── proyecto-claude/            ← documentos para el proyecto de Claude
```

Asignaturas (ids): `matematicas`, `lengua`, `naturales`, `sociales`, `ingles`.

---

## 2. El catálogo: `contenido/indice.json`

Cada tema es una entrada de la lista `temas`. **El orden de la lista es el orden en que aparecen en la web.**

```json
{ "id": "5-nat-05", "curso": 5, "asignatura": "naturales",
  "titulo": "El sistema circulatorio", "emoji": "❤️",
  "archivo": "5/naturales/05-circulatorio.md" }
```

| Campo | Regla |
|---|---|
| `id` | `<curso>-<abreviatura>-<NN>`. Abreviaturas: `mat`, `len`, `nat`, `soc`, `ing`. **Nunca cambies el id de un tema que ya existe**: el progreso de los niños está guardado con ese id. |
| `curso` | `5` o `6` (número, sin comillas). |
| `asignatura` | Uno de los ids de asignatura. |
| `titulo` | Corto (caben unas 40 letras en el móvil). |
| `emoji` | Un solo emoji que represente el tema. |
| `archivo` | Ruta dentro de `contenido/`. |

### "Ahora en clase"

La lista `"ahora": ["5-nat-05"]` controla qué temas aparecen destacados en la pantalla de inicio con la etiqueta **Ahora**. Cuando en clase cambien de tema, **solo hay que cambiar esta lista** (puede tener varios ids, por ejemplo uno por asignatura).

---

## 3. El archivo de un tema (`.md`)

Cada tema es **un archivo de texto en Markdown** con dos partes separadas por la línea `# Examen`:

```markdown
## Primer apartado de los apuntes
Texto…

## Segundo apartado
Texto…

# Examen

preguntas: 10

? Pregunta tipo test
+ Respuesta correcta
- Respuesta incorrecta
- Otra incorrecta
- Otra incorrecta
> Explicación que se muestra al responder.
```

### 3.1 Apuntes: qué Markdown se puede usar

| Escribes | Se ve |
|---|---|
| `## Título` / `### Subtítulo` | Títulos (no uses `#` solo: está reservado para `# Examen`). |
| `**negrita**` · `*cursiva*` | **negrita** · *cursiva* |
| `CO~2~` · `10^3^` | Subíndice y superíndice (CO₂, 10³). |
| `- elemento` / `1. elemento` | Listas. |
| `> 💡 **Recuerda:** …` | Recuadro destacado de color. |
| `\| A \| B \|` + `\|---\|---\|` | Tablas. Si tienen 3 o más columnas con textos largos, en el móvil se convierten en fichas automáticamente. |
| `![Pie de foto](img/carpeta/imagen.svg)` | Imagen con pie. La ruta empieza en la raíz del repositorio. |
| `---` | Línea separadora. |

**No uses:** HTML, enlaces, tachado (`~~`), bloques de código ni `#` de nivel 1 en los apuntes.

### 3.2 Examen: los ocho tipos de pregunta

Cada pregunta empieza con `? ` (interrogación + espacio). Debajo van sus líneas. **Siempre** termina con `> explicación` (una o dos frases que enseñen por qué). La web baraja el orden de las opciones, las piezas y los elementos.

En el móvil **no se arrastra nada**: en ordenar se tocan las piezas en orden, en clasificar se toca la categoría de cada elemento y en relacionar se elige en un desplegable.

**1. Test (una respuesta)** — una línea `+` (la correcta) y entre 2 y 4 líneas `-`.

```
? ¿Cuál es el planeta más grande?
+ Júpiter
- Saturno
- La Tierra
- Neptuno
> Júpiter es un gigante gaseoso.
```

**2. Respuesta múltiple** — empieza con `?*` (o pon dos o más `+`). Hay que marcar **todas** las correctas y ninguna incorrecta.

```
?* ¿Qué planetas son gaseosos?
+ Júpiter
+ Saturno
- Marte
- Venus
> Marte y Venus son rocosos.
```

**3. Verdadero o falso** — una línea `= verdadero` o `= falso`.

```
? Los planetas tienen luz propia.
= falso
> Solo reflejan la luz del Sol.
```

**4. Escribir la respuesta** — una línea `=` con todas las formas válidas separadas por `|`.

```
? ¿Cómo se llama nuestra galaxia?
= vía láctea | la vía láctea
> Tiene forma de espiral.
```

**5. Rellenar huecos** — los huecos van entre corchetes dentro del texto: `[respuesta]` o `[respuesta|variante]`.

- **Sin líneas `-`**: el alumno **escribe** cada hueco (se corrige igual que "escribir").
- **Con líneas `-`**: cada hueco es un **menú** con las respuestas de todos los huecos más esas palabras de relleno, y se corrige **exactamente** (tildes y mayúsculas incluidas). Úsalo en ortografía y tildes. Las palabras de relleno no pueden coincidir con ninguna respuesta.

```
? Completa: El corazón tiene [cuatro|4] cavidades: dos [aurículas] y dos [ventrículos].
> Las aurículas están arriba.

? Completa: [Tú] sabes que [tu] hermano viene hoy.
- Tu
- tú
> Pronombre con tilde; posesivo sin tilde.
```

**6. Ordenar** — líneas numeradas `1.`, `2.`, `3.`… **en el orden correcto** (mínimo 3). La web las desordena.

```
? Ordena el recorrido de la sangre desde el corazón.
1. Ventrículo izquierdo
2. Arteria aorta
3. Capilares del cuerpo
4. Venas cavas
> Es la circulación mayor.
```

**7. Clasificar** — una línea `@ Categoría: elemento | elemento | …` por categoría (mínimo 2 categorías y 3 elementos en total, sin repetir elementos).

```
? Clasifica cada animal.
@ Vertebrado: perro | águila | sardina
@ Invertebrado: pulpo | mosca | caracol
> Los vertebrados tienen columna vertebral.
```

**8. Relacionar** — líneas `* izquierda → derecha` (mínimo 3 parejas; las de la derecha deben ser **todas distintas**). También vale `->`.

```
? Relaciona cada órgano con su función.
* Corazón → Bombea la sangre
* Pulmones → Intercambian gases
* Riñones → Filtran la sangre
> Cada órgano tiene su trabajo.
```

Al corregir las respuestas escritas, la web **no tiene en cuenta**: mayúsculas, tildes, signos de puntuación, apóstrofos, espacios de más, ni artículos al principio (*el, la, los, las, un, una, the, an*). También entiende `3,5` = `3.5` y `3.500` = `3500`. Aun así, **añade las variantes razonables** (por ejemplo `180 | 180° | 180 grados`, `didn't | did not`, `−2 | -2`). Por eso, **si la tilde es lo que se evalúa, no uses "escribir"**: usa test o huecos con menú.

`preguntas: 20` (justo debajo de `# Examen`) indica cuántas preguntas salen en cada examen; si hay más en el banco, se eligen al azar cada vez. Por defecto son **20**.

---

## 4. Normas de estilo (para niños de 10-12 años)

1. **Siempre apuntes y después examen.** Ningún tema sin las dos partes.
2. **Español de España**, frases cortas, tuteando al alumno. En Inglés, explicaciones en español y ejemplos en inglés.
3. **Lo esencial primero.** Definición clara → partes/tipos → ejemplos → errores típicos → resumen.
4. **Negritas solo en las palabras clave** que tienen que aprenderse.
5. **Tablas** para comparar y clasificar; **listas** para pasos y enumeraciones.
6. Recuadros con emoji al principio: `💡` truco o idea clave, `⚠️` error típico o pregunta trampa, `🧠` regla mnemotécnica, `🔬`/`🌍`/`🎨` dato curioso.
7. Apuntes de **400 a 900 palabras**. Temas grandes o "ahora en clase": se pueden ampliar y añadir esquemas.
8. **Examen de unas 20 preguntas** (banco de 20-22 y `preguntas: 20`), **variado**: usa al menos 5 tipos distintos y mezcla test, respuesta múltiple, verdadero/falso, escribir, huecos, ordenar, clasificar y relacionar según lo que mejor encaje con cada contenido.
9. **Sin pistas.** El enunciado no puede dar la respuesta (nada de "(empieza por…)", "(es de tres sílabas)", cifras entre paréntesis en un ordenar, etc.), la opción correcta no debe ser la más larga ni la única bien escrita, y las incorrectas deben ser **creíbles** (errores típicos), nunca absurdas. En test, **solo una** opción correcta.
10. En las respuestas escritas, pide **una palabra o un número**, no frases largas. En relacionar, que cada elemento de la derecha solo encaje con uno de la izquierda.
11. **Comprueba todos los cálculos** de Matemáticas antes de guardar.
12. **Nada de datos personales**: el repositorio es público. Ni nombres de los niños, ni del colegio, ni fotos de personas.
13. Los datos que cambian con el tiempo (población, cargos, número de países…) se escriben de forma prudente (*"más de 48 millones"*) o con el año.

---

## 5. Imágenes y esquemas

- Guárdalas en `img/<asignatura>/`. Formatos: **SVG** (mejor, se ve nítido) o PNG/JPG de menos de 300 KB.
- Los SVG deben tener **fondo blanco**, textos de **14 px o más** y colores con buen contraste (se ven en móvil).
- Nunca subas fotos de libros con derechos de autor ni imágenes de personas reales.

---

## 6. Cómo añadir un tema nuevo (paso a paso)

1. Crea el archivo `contenido/<curso>/<asignatura>/NN-nombre.md` con apuntes y examen.
2. Añade su entrada en `contenido/indice.json`, en el lugar que le toca en el orden.
3. Ejecuta `node herramientas/validar.js` → debe terminar con **0 errores**.
4. Ejecuta `node herramientas/temario.js` para actualizar `proyecto-claude/TEMARIO.md`.
5. Haz commit y push a `main`. GitHub Pages publica los cambios en 1-2 minutos.

Para **modificar** un tema basta con editar su `.md`. Para **reordenar**, mueve la entrada en `indice.json` (no cambies su `id`).

---

## 7. Cómo funciona el progreso

- Hay dos perfiles (niño y niña), sin nombres. Cada uno elige avatar y curso.
- El progreso se guarda **en el navegador de cada dispositivo** (localStorage), con la clave `repasoCole.v1`. No viaja entre el móvil y la tablet.
- Estados de un tema: ⚪ sin empezar → 📖 apuntes leídos → 💪 suspendido (nota < 5) → ✅ aprobado (≥ 5) → ⭐ dominado (≥ 8).
- Se guardan la mejor nota, la última, el número de intentos, las preguntas falladas (para el botón "Repasar mis fallos") y un historial de los últimos 40 exámenes.
- El identificador de cada pregunta se calcula a partir de su texto y su respuesta: si cambias una pregunta, sus fallos antiguos simplemente dejan de contarse.
