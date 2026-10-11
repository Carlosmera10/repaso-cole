#!/usr/bin/env node
/*
 * Genera proyecto-claude/TEMARIO.md a partir de contenido/indice.json.
 * Uso:  node herramientas/temario.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var F = require('../js/formato.js');

var raiz = path.join(__dirname, '..');
var indice = JSON.parse(fs.readFileSync(path.join(raiz, 'contenido', 'indice.json'), 'utf8'));
var ahora = indice.ahora || [];
var lineas = [
  '# Temario de Repaso Cole',
  '',
  '> Archivo generado automáticamente con `node herramientas/temario.js`. No lo edites a mano: cambia `contenido/indice.json` y vuelve a generarlo.',
  '',
  'Leyenda: 🔥 = tema que se está dando ahora en clase (lista `ahora` del índice).',
  ''
];

Object.keys(indice.cursos).forEach(function (c) {
  lineas.push('## ' + indice.cursos[c] + ' de Primaria', '');
  indice.asignaturas.forEach(function (a) {
    var temas = indice.temas.filter(function (t) { return String(t.curso) === c && t.asignatura === a.id; });
    if (!temas.length) return;
    lineas.push('### ' + a.emoji + ' ' + a.nombre, '', '| Nº | Id | Tema | Preguntas | Archivo |', '|---|---|---|---|---|');
    temas.forEach(function (t, i) {
      var n = '—';
      var ruta = path.join(raiz, 'contenido', t.archivo);
      if (fs.existsSync(ruta)) n = F.leerTema(fs.readFileSync(ruta, 'utf8'), '').examen.preguntas.length;
      lineas.push('| ' + (i + 1) + ' | `' + t.id + '` | ' + t.emoji + ' ' + t.titulo + (ahora.indexOf(t.id) >= 0 ? ' 🔥' : '') +
        ' | ' + n + ' | `contenido/' + t.archivo + '` |');
    });
    lineas.push('');
  });
});

lineas.push('---', '', 'Total: **' + indice.temas.length + ' temas**.', '');
fs.writeFileSync(path.join(raiz, 'proyecto-claude', 'TEMARIO.md'), lineas.join('\n'));
console.log('TEMARIO.md actualizado (' + indice.temas.length + ' temas).');
