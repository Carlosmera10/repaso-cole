/*
 * formato.js — Lee los archivos de tema (.md) y los convierte en apuntes + examen.
 * Funciona en el navegador (window.Formato) y en Node (require) para poder validarlo.
 *
 * Formato de un tema (ver proyecto-claude/GUIA_CONTENIDO.md):
 *   ...apuntes en Markdown...
 *   # Examen
 *   preguntas: 10            (opcional: cuántas preguntas salen en cada examen)
 *   ? Pregunta tipo test
 *   + respuesta correcta
 *   - respuesta incorrecta
 *   > explicación
 *   ? Pregunta de verdadero o falso
 *   = verdadero
 *   > explicación
 *   ? Pregunta para escribir
 *   = respuesta | otra forma válida
 *   > explicación
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Formato = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function escapar(t) {
    return String(t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Negrita, cursiva y "subíndices" sencillos. Se aplica sobre texto ya escapado.
  function enLinea(t) {
    return escapar(t)
      .replace(/\*\*([^*\s](?:.*?[^*\s])??)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/~(\S+?)~/g, '<sub>$1</sub>')
      .replace(/\^(\S+?)\^/g, '<sup>$1</sup>');
  }

  function celdas(linea) {
    return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); });
  }

  // Markdown reducido: ## ### párrafos, listas, > recuadros, tablas, imágenes, ---.
  function markdownAHtml(md, base) {
    var lineas = md.replace(/\r\n?/g, '\n').split('\n');
    var html = [];
    var i = 0;
    base = base || '';

    while (i < lineas.length) {
      var l = lineas[i];
      var t = l.trim();

      if (!t) { i++; continue; }

      var h = /^(#{2,4})\s+(.*)$/.exec(t);
      if (h) {
        var nivel = h[1].length;
        html.push('<h' + nivel + '>' + enLinea(h[2]) + '</h' + nivel + '>');
        i++; continue;
      }

      if (/^-{3,}$/.test(t)) { html.push('<hr>'); i++; continue; }

      var img = /^!\[(.*?)\]\((.+?)\)$/.exec(t);
      if (img) {
        var src = /^(https?:)?\//.test(img[2]) ? img[2] : base + img[2];
        html.push('<figure><img src="' + escapar(src) + '" alt="' + escapar(img[1]) + '" loading="lazy"><figcaption>' + enLinea(img[1]) + '</figcaption></figure>');
        i++; continue;
      }

      if (t.charAt(0) === '>') {
        var bloque = [];
        while (i < lineas.length && lineas[i].trim().charAt(0) === '>') {
          bloque.push(lineas[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        html.push('<aside class="recuadro">' + bloque.map(enLinea).join('<br>') + '</aside>');
        continue;
      }

      if (t.charAt(0) === '|') {
        var filas = [];
        while (i < lineas.length && lineas[i].trim().charAt(0) === '|') {
          filas.push(lineas[i]);
          i++;
        }
        var cab = celdas(filas[0]);
        var cuerpo = filas.slice(1).filter(function (f) { return !/^\|?\s*:?-{2,}/.test(f.trim()); });
        // Las tablas de 3 o más columnas se convierten en fichas en pantallas estrechas.
        var largo = cuerpo.reduce(function (m, f) {
          return Math.max(m, Math.max.apply(null, celdas(f).map(function (c) { return c.length; })));
        }, 0);
        var fichas = cab.length >= 3 && largo > 40;
        var tabla = '<div class="tabla' + (fichas ? ' tabla--fichas' : '') + '"><table><thead><tr>' + cab.map(function (c) { return '<th>' + enLinea(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        tabla += cuerpo.map(function (f) {
          return '<tr>' + celdas(f).map(function (c, k) {
            return '<td data-label="' + escapar((cab[k] || '').replace(/\*/g, '')) + '">' + enLinea(c) + '</td>';
          }).join('') + '</tr>';
        }).join('');
        html.push(tabla + '</tbody></table></div>');
        continue;
      }

      if (/^[-*]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
        var ordenada = /^\d+[.)]\s+/.test(t);
        var items = [];
        while (i < lineas.length) {
          var x = lineas[i].trim();
          if (ordenada ? /^\d+[.)]\s+/.test(x) : /^[-*]\s+/.test(x)) {
            items.push(x.replace(/^([-*]|\d+[.)])\s+/, ''));
            i++;
          } else if (x && /^\s{2,}/.test(lineas[i]) && items.length) {
            items[items.length - 1] += ' ' + x; // continuación de la línea anterior
            i++;
          } else break;
        }
        var tag = ordenada ? 'ol' : 'ul';
        html.push('<' + tag + '>' + items.map(function (it) { return '<li>' + enLinea(it) + '</li>'; }).join('') + '</' + tag + '>');
        continue;
      }

      var parrafo = [];
      while (i < lineas.length) {
        var y = lineas[i].trim();
        if (!y || /^(#{2,4}\s|[-*]\s|\d+[.)]\s|>|\||!\[|-{3,}$)/.test(y)) break;
        parrafo.push(y);
        i++;
      }
      html.push('<p>' + enLinea(parrafo.join(' ')) + '</p>');
    }
    return html.join('\n');
  }

  var VERDADERO = ['verdadero', 'v', 'true', 'si', 'sí'];
  var FALSO = ['falso', 'f', 'false', 'no'];
  var HUECO = /\[([^\]]+)\]/g;

  function separar(resto) {
    return resto.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /*
   * Tipos de pregunta (ver proyecto-claude/GUIA_CONTENIDO.md):
   *   test       ? … / + correcta / - incorrectas
   *   multiple   ?* … (o varias +) / + correctas / - incorrectas
   *   vf         ? … / = verdadero | falso
   *   escribir   ? … / = respuesta | variante
   *   huecos     ? Texto con [respuesta|variante] y [otro] / (- palabras de relleno → menús)
   *   ordenar    ? … / 1. primero / 2. segundo / 3. …
   *   clasificar ? … / @ Categoría: elemento | elemento
   *   relacionar ? … / * izquierda → derecha
   */
  function leerExamen(texto) {
    var lineas = texto.replace(/\r\n?/g, '\n').split('\n');
    var preguntas = [];
    var config = { preguntas: 20 };
    var actual = null;
    var avisos = [];

    lineas.forEach(function (l, n) {
      var t = l.trim();
      if (!t) return;
      var m;
      if ((m = /^preguntas:\s*(\d+)/i.exec(t)) && !actual) { config.preguntas = parseInt(m[1], 10); return; }
      if (/^\?\*?\s/.test(t)) {
        actual = {
          texto: t.replace(/^\?\*?\s+/, ''), forzarMultiple: t.charAt(1) === '*',
          correctas: [], incorrectas: [], respuestas: [], orden: [], categorias: [], pares: [],
          explicacion: '', linea: n + 1
        };
        preguntas.push(actual);
        return;
      }
      if (!actual) { avisos.push('Línea ' + (n + 1) + ' fuera de una pregunta: ' + t); return; }
      var marca = t.charAt(0);
      var resto = t.slice(1).trim();
      if ((m = /^(\d+)[.)]\s+(.*)$/.exec(t))) actual.orden.push(m[2].trim());
      else if (marca === '+') actual.correctas.push(resto);
      else if (marca === '-') actual.incorrectas.push(resto);
      else if (marca === '=') actual.respuestas = actual.respuestas.concat(separar(resto));
      else if (marca === '@') {
        var dos = resto.indexOf(':');
        if (dos < 0) avisos.push('Línea ' + (n + 1) + ': la categoría necesita ":" → @ Nombre: a | b');
        else actual.categorias.push({ nombre: resto.slice(0, dos).trim(), elementos: separar(resto.slice(dos + 1)) });
      } else if (marca === '*') {
        var par = resto.split(/\s*(?:→|->)\s*/);
        if (par.length !== 2) avisos.push('Línea ' + (n + 1) + ': la pareja necesita una flecha → izquierda → derecha');
        else actual.pares.push({ izq: par[0], der: par[1] });
      } else if (marca === '>') actual.explicacion += (actual.explicacion ? ' ' : '') + resto;
      else actual.texto += ' ' + t; // pregunta en varias líneas
    });

    preguntas.forEach(function (p, idx) {
      p.num = idx + 1;
      var donde = 'Pregunta ' + p.num + ' (línea ' + p.linea + '): ';
      var clave;
      if (p.orden.length) {
        p.tipo = 'ordenar';
        if (p.orden.length < 3) avisos.push(donde + 'para ordenar hacen falta al menos 3 elementos');
        clave = p.orden.join('>');
      } else if (p.categorias.length) {
        p.tipo = 'clasificar';
        if (p.categorias.length < 2) avisos.push(donde + 'para clasificar hacen falta al menos 2 categorías');
        var todos = [];
        p.categorias.forEach(function (c) { todos = todos.concat(c.elementos); });
        if (todos.length < 3) avisos.push(donde + 'para clasificar hacen falta al menos 3 elementos');
        if (todos.some(function (x, i) { return todos.indexOf(x) !== i; })) avisos.push(donde + 'hay elementos repetidos en las categorías');
        clave = p.categorias.map(function (c) { return c.nombre + ':' + c.elementos.join(','); }).join(';');
      } else if (p.pares.length) {
        p.tipo = 'relacionar';
        if (p.pares.length < 3) avisos.push(donde + 'para relacionar hacen falta al menos 3 parejas');
        var der = p.pares.map(function (x) { return x.der; });
        if (der.some(function (x, i) { return der.indexOf(x) !== i; })) avisos.push(donde + 'las respuestas de la derecha deben ser distintas');
        clave = p.pares.map(function (x) { return x.izq + '=' + x.der; }).join(';');
      } else if (HUECO.test(p.texto)) {
        HUECO.lastIndex = 0;
        p.tipo = 'huecos';
        p.huecos = [];
        p.texto.replace(HUECO, function (_, r) { p.huecos.push(separar(r)); return ''; });
        p.conMenu = p.incorrectas.length > 0;
        clave = p.huecos.map(function (h) { return h[0]; }).join('|');
      } else if (p.forzarMultiple || p.correctas.length > 1) {
        p.tipo = 'multiple';
        if (!p.correctas.length) avisos.push(donde + 'falta al menos una respuesta correcta (+)');
        if (!p.incorrectas.length) avisos.push(donde + 'falta al menos una respuesta incorrecta (-)');
        clave = p.correctas.join('|');
      } else if (p.correctas.length || p.incorrectas.length) {
        p.tipo = 'test';
        if (p.correctas.length !== 1) avisos.push(donde + 'un test necesita exactamente una respuesta con +');
        if (p.incorrectas.length < 1) avisos.push(donde + 'un test necesita al menos una respuesta con -');
        clave = p.correctas[0];
      } else if (p.respuestas.length === 1 && (VERDADERO.indexOf(p.respuestas[0].toLowerCase()) >= 0 || FALSO.indexOf(p.respuestas[0].toLowerCase()) >= 0)) {
        p.tipo = 'vf';
        p.valor = VERDADERO.indexOf(p.respuestas[0].toLowerCase()) >= 0;
        clave = String(p.valor);
      } else if (p.respuestas.length) {
        p.tipo = 'escribir';
        clave = p.respuestas.join('|');
      } else {
        p.tipo = 'error';
        clave = '';
        avisos.push(donde + 'no tiene respuestas');
      }
      if (!p.explicacion) avisos.push(donde + 'falta la explicación (>)');
      p.id = huella(p.texto + '|' + clave);
    });
    HUECO.lastIndex = 0;

    return { config: config, preguntas: preguntas, avisos: avisos };
  }

  // Identificador estable de una pregunta a partir de su texto.
  function huella(t) {
    var h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function leerTema(md, base) {
    var texto = md.replace(/\r\n?/g, '\n');
    var corte = texto.search(/^#\s+Examen\s*$/m);
    var apuntes = corte >= 0 ? texto.slice(0, corte) : texto;
    var examen = corte >= 0 ? texto.slice(corte).replace(/^#\s+Examen\s*$/m, '') : '';
    apuntes = apuntes.replace(/^#\s+Apuntes\s*$/m, '');
    var ex = leerExamen(examen);
    if (corte < 0) ex.avisos.unshift('El tema no tiene la línea "# Examen"');
    return {
      apuntesHtml: markdownAHtml(apuntes, base),
      apuntesMd: apuntes.trim(),
      examen: ex
    };
  }

  // Normaliza una respuesta escrita para compararla sin tildes, mayúsculas ni artículos.
  function normalizar(s) {
    return String(s)
      .toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/['\u2019\u2018\u00b4`]/g, '')           // doesn't = doesnt
      .replace(/(\d)[. ](?=\d{3}(\D|$))/g, '$1')   // 3.500 o 3 500 -> 3500
      .replace(/(\d),(\d)/g, '$1.$2')              // 3,5 -> 3.5
      .replace(/(\d)\.(\d)/g, '$1§$2')
      .replace(/[¿?¡!.,;:"()«»“”]/g, ' ')
      .replace(/§/g, '.')
      .replace(/(\d)([a-z€%°])/g, '$1 $2')            // 3000m -> 3000 m
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(el|la|los|las|un|una|unos|unas|the|an) /, '');
  }

  function comprobarEscrita(pregunta, valor) {
    var v = normalizar(valor);
    if (!v) return false;
    return pregunta.respuestas.some(function (r) { return normalizar(r) === v; });
  }

  return {
    escapar: escapar,
    enLinea: enLinea,
    markdownAHtml: markdownAHtml,
    leerTema: leerTema,
    leerExamen: leerExamen,
    normalizar: normalizar,
    comprobarEscrita: comprobarEscrita,
    huella: huella
  };
});
