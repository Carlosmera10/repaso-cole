#!/usr/bin/env node
/*
 * Comprueba que todo el contenido está bien escrito.
 * Uso:  node herramientas/validar.js
 * Revisa: que cada tema del índice tiene su archivo, que tiene apuntes y examen,
 * que las preguntas están bien formadas y que no hay archivos sin catalogar.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var F = require('../js/formato.js');

var raiz = path.join(__dirname, '..');
var dirContenido = path.join(raiz, 'contenido');
var indice = JSON.parse(fs.readFileSync(path.join(dirContenido, 'indice.json'), 'utf8'));
var errores = 0;
var avisos = 0;
var totalPreguntas = 0;
var resumenTipos = {};
function totalTipos(t) { Object.keys(t).forEach(function (k) { resumenTipos[k] = (resumenTipos[k] || 0) + t[k]; }); }
var ids = {};
var archivos = {};
var asignaturas = indice.asignaturas.map(function (a) { return a.id; });

function error(t, msg) { errores++; console.log('❌ ' + t + ': ' + msg); }
function aviso(t, msg) { avisos++; console.log('⚠️  ' + t + ': ' + msg); }

indice.temas.forEach(function (t) {
  var nombre = t.id || '(sin id)';
  ['id', 'curso', 'asignatura', 'titulo', 'emoji', 'archivo'].forEach(function (k) {
    if (t[k] === undefined || t[k] === '') error(nombre, 'falta el campo "' + k + '" en indice.json');
  });
  if (ids[t.id]) error(nombre, 'id repetido');
  ids[t.id] = true;
  if (asignaturas.indexOf(t.asignatura) < 0) error(nombre, 'asignatura desconocida "' + t.asignatura + '"');
  if (!indice.cursos[String(t.curso)]) error(nombre, 'curso desconocido "' + t.curso + '"');

  var ruta = path.join(dirContenido, t.archivo);
  archivos[path.normalize(ruta)] = true;
  if (!fs.existsSync(ruta)) { error(nombre, 'no existe el archivo ' + t.archivo); return; }

  var md = fs.readFileSync(ruta, 'utf8');
  var tema = F.leerTema(md, '');
  if (tema.apuntesMd.length < 300) aviso(nombre, 'los apuntes son muy cortos');
  tema.examen.avisos.forEach(function (a) { error(nombre, a); });

  var ps = tema.examen.preguntas;
  totalPreguntas += ps.length;
  if (ps.length < 20) aviso(nombre, 'solo tiene ' + ps.length + ' preguntas (mínimo recomendado: 20)');
  if (tema.examen.config.preguntas > ps.length) aviso(nombre, 'pide ' + tema.examen.config.preguntas + ' preguntas por examen pero solo hay ' + ps.length);

  var tipos = {};
  ps.forEach(function (p) { tipos[p.tipo] = (tipos[p.tipo] || 0) + 1; });
  if (Object.keys(tipos).length < 4) aviso(nombre, 'poca variedad: solo usa ' + Object.keys(tipos).join(', '));
  ps.forEach(function (p) {
    if (p.tipo === 'huecos' && p.conMenu) {
      p.huecos.forEach(function (h) { if (p.incorrectas.indexOf(h[0]) >= 0) error(nombre, 'una palabra de relleno es también respuesta: ' + h[0]); });
    }
  });
  totalTipos(tipos);

  var vistas = {};
  ps.forEach(function (p) {
    if (vistas[p.id]) error(nombre, 'pregunta repetida: ' + p.texto);
    vistas[p.id] = true;
    if (p.tipo === 'test' || p.tipo === 'multiple') {
      var todas = p.correctas.concat(p.incorrectas);
      var unicas = todas.filter(function (x, i) { return todas.indexOf(x) === i; });
      if (unicas.length !== todas.length) error(nombre, 'opciones repetidas en: ' + p.texto);
    }
  });

  // Imágenes enlazadas
  (md.match(/!\[.*?\]\((.+?)\)/g) || []).forEach(function (m) {
    var src = /\((.+?)\)/.exec(m)[1];
    if (!/^https?:/.test(src) && !fs.existsSync(path.join(raiz, src))) error(nombre, 'no existe la imagen ' + src);
  });
});

// Archivos .md que no están en el índice
(function recorrer(dir) {
  fs.readdirSync(dir).forEach(function (f) {
    var r = path.join(dir, f);
    if (fs.statSync(r).isDirectory()) recorrer(r);
    else if (/\.md$/.test(f) && !archivos[path.normalize(r)]) aviso(path.relative(raiz, r), 'el archivo no aparece en indice.json');
  });
})(dirContenido);

(indice.ahora || []).forEach(function (id) { if (!ids[id]) error('ahora', 'el tema "' + id + '" no existe'); });

console.log('\nTipos: ' + JSON.stringify(resumenTipos));
console.log(indice.temas.length + ' temas · ' + totalPreguntas + ' preguntas · ' + errores + ' errores · ' + avisos + ' avisos');
process.exit(errores ? 1 : 0);
