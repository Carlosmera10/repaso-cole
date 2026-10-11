# 📚 Repaso Cole

Apuntes y exámenes de **5º y 6º de Primaria** para repasar en el móvil y la tablet.

👉 **https://carlosmera10.github.io/repaso-cole/**

## Qué tiene

- **105 temas** de Matemáticas, Lengua, Ciencias Naturales, Ciencias Sociales e Inglés (5º y 6º).
- Cada tema tiene **apuntes** y, al terminar de leerlos, un **examen** con corrección y explicación al momento.
- **Dos perfiles** (niño y niña, sin nombres) con avatar y curso.
- **Progreso**: estado de cada tema (⚪ 📖 💪 ✅ ⭐), mejor nota, historial y repaso de las preguntas falladas.
- Sección **"Lo que estamos dando"** con el tema actual de clase.
- Funciona como app: en el móvil, *Añadir a pantalla de inicio*. Modo claro y oscuro.

## Documentación

| Archivo | Para qué |
|---|---|
| [`proyecto-claude/COMO_USAR.md`](proyecto-claude/COMO_USAR.md) | Guía para padres: la web y el proyecto de Claude. |
| [`proyecto-claude/INSTRUCCIONES_PROYECTO.md`](proyecto-claude/INSTRUCCIONES_PROYECTO.md) | Texto para pegar en las instrucciones del proyecto de Claude. |
| [`proyecto-claude/GUIA_CONTENIDO.md`](proyecto-claude/GUIA_CONTENIDO.md) | Formato de los temas y normas de estilo. |
| [`proyecto-claude/PLANTILLA_TEMA.md`](proyecto-claude/PLANTILLA_TEMA.md) | Plantilla para un tema nuevo. |
| [`proyecto-claude/TEMARIO.md`](proyecto-claude/TEMARIO.md) | Lista de todos los temas. |
| [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) | Instrucciones para asistentes de IA. |

## Probar en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
node herramientas/validar.js
```

## Publicar

En GitHub: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.
