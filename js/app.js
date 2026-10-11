/*
 * Repaso Cole — aplicación de apuntes y exámenes.
 * - El catálogo de temas está en contenido/indice.json
 * - Cada tema es un archivo .md en contenido/<curso>/<asignatura>/
 * - El progreso se guarda en el propio dispositivo (localStorage), por perfil.
 */
(function () {
  'use strict';

  var F = window.Formato;
  var esc = F.escapar;
  var CLAVE = 'repasoCole.v1';
  var AVATARES = ['🦁', '🐯', '🦊', '🐼', '🐨', '🐸', '🦄', '🐙', '🦋', '🐬', '🦖', '🐝', '🐱', '🐶', '🐰', '🐧', '🦉', '🚀'];
  var PUNTOS = { nuevo: 0, leido: 0.2, intentado: 0.35, aprobado: 0.7, dominado: 1 };
  var ESTADOS = {
    nuevo: { icono: '⚪', texto: 'Sin empezar' },
    leido: { icono: '📖', texto: 'Apuntes leídos' },
    intentado: { icono: '💪', texto: 'Hay que repasar' },
    aprobado: { icono: '✅', texto: 'Aprobado' },
    dominado: { icono: '⭐', texto: '¡Dominado!' }
  };

  var app = document.getElementById('app');
  var catalogo = null;
  var cacheTemas = {};
  var sesion = null; // examen en curso
  var datos = cargarDatos();

  /* ================= Datos guardados ================= */

  function datosIniciales() {
    return {
      activo: null,
      perfiles: [
        { id: 'nino', apodo: 'Niño', avatar: '🦁', color: '#FFD8A8', curso: 5 },
        { id: 'nina', apodo: 'Niña', avatar: '🦋', color: '#E9D5FF', curso: 5 }
      ],
      progreso: { nino: {}, nina: {} },
      historial: { nino: [], nina: [] },
      vista: {}
    };
  }

  function cargarDatos() {
    var base = datosIniciales();
    try {
      var guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (guardado && guardado.perfiles) {
        Object.keys(base).forEach(function (k) { if (!(k in guardado)) guardado[k] = base[k]; });
        guardado.perfiles.forEach(function (p) {
          if (!guardado.progreso[p.id]) guardado.progreso[p.id] = {};
          if (!guardado.historial[p.id]) guardado.historial[p.id] = [];
        });
        return guardado;
      }
    } catch (e) { /* sin almacenamiento: se trabaja en memoria */ }
    return base;
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* ignorar */ }
  }

  function perfilActivo() {
    return datos.perfiles.filter(function (p) { return p.id === datos.activo; })[0] || null;
  }

  function progresoDe(pid, temaId) {
    var pr = datos.progreso[pid] || (datos.progreso[pid] = {});
    return pr[temaId] || (pr[temaId] = {});
  }

  function leerProgreso(pid, temaId) {
    return (datos.progreso[pid] || {})[temaId] || {};
  }

  /* ================= Cálculos de progreso ================= */

  function estado(p) {
    if (p.mejor >= 8) return 'dominado';
    if (p.mejor >= 5) return 'aprobado';
    if (p.intentos > 0) return 'intentado';
    if (p.leido) return 'leido';
    return 'nuevo';
  }

  function temasDe(curso, asig) {
    return catalogo.temas.filter(function (t) {
      return t.curso === curso && (!asig || t.asignatura === asig);
    });
  }

  function resumen(pid, temas) {
    var r = { total: temas.length, aprobados: 0, dominados: 0, empezados: 0, pct: 0 };
    var suma = 0;
    temas.forEach(function (t) {
      var e = estado(leerProgreso(pid, t.id));
      suma += PUNTOS[e];
      if (e !== 'nuevo') r.empezados++;
      if (e === 'aprobado' || e === 'dominado') r.aprobados++;
      if (e === 'dominado') r.dominados++;
    });
    r.pct = r.total ? Math.round((suma / r.total) * 100) : 0;
    return r;
  }

  function asignatura(id) {
    return catalogo.asignaturas.filter(function (a) { return a.id === id; })[0];
  }

  function tema(id) {
    return catalogo.temas.filter(function (t) { return t.id === id; })[0];
  }

  function numeroTema(t) {
    return temasDe(t.curso, t.asignatura).indexOf(t) + 1;
  }

  function nota(n) {
    return (Math.round(n * 10) / 10).toString().replace('.', ',');
  }

  function cursoVista(perfil) {
    return datos.vista[perfil.id] || perfil.curso;
  }

  /* ================= Utilidades de vista ================= */

  function barraProgreso(pct, color) {
    return '<div class="barra-progreso" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"' +
      (color ? ' style="--c:' + color + '"' : '') + '><span style="width:' + pct + '%"></span></div>';
  }

  function barra(atras, titulo, conPerfil) {
    var p = perfilActivo();
    return '<header class="barra">' +
      (atras ? '<a class="boton-icono" href="' + atras + '" aria-label="Volver">←</a>' : '') +
      '<div class="barra__titulo">' + titulo + '</div>' +
      (conPerfil && p ? '<a class="avatar-chip" href="#/progreso" style="--pc:' + p.color + '"><span class="avatar-chip__cara">' + p.avatar + '</span>' + esc(p.apodo) + '</a>' : '') +
      '</header>';
  }

  function pintar(html, color) {
    document.documentElement.style.setProperty('--c', color || '#FF7A45');
    app.innerHTML = html;
  }

  function ir(ruta) { location.hash = ruta; }

  function barajar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }

  function cargarTema(t) {
    if (cacheTemas[t.id]) return Promise.resolve(cacheTemas[t.id]);
    return fetch('contenido/' + t.archivo, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('No se encontró ' + t.archivo); return r.text(); })
      .then(function (md) { cacheTemas[t.id] = F.leerTema(md, ''); return cacheTemas[t.id]; });
  }

  function confeti() {
    var cosas = ['🎉', '⭐', '✨', '🎊', '🌟'];
    for (var i = 0; i < 18; i++) {
      var s = document.createElement('span');
      s.className = 'confeti';
      s.textContent = cosas[i % cosas.length];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.animationDelay = (Math.random() * 0.6) + 's';
      document.body.appendChild(s);
      setTimeout(function (el) { el.remove(); }, 3200, s);
    }
  }

  /* ================= Pantallas ================= */

  function vistaPerfiles() {
    var tarjetas = datos.perfiles.map(function (p) {
      var r = resumen(p.id, temasDe(p.curso));
      return '<div class="perfil" role="button" tabindex="0" data-accion="elegir-perfil" data-id="' + p.id + '" style="--pc:' + p.color + '">' +
        '<button class="perfil__editar" data-accion="editar-perfil" data-id="' + p.id + '" aria-label="Cambiar avatar y curso">✏️</button>' +
        '<div class="perfil__cara">' + p.avatar + '</div>' +
        '<div class="perfil__nombre">' + esc(p.apodo) + '</div>' +
        '<div class="perfil__curso">' + p.curso + 'º de Primaria</div>' +
        '<div class="perfil__barra">' + barraProgreso(r.pct, '#FF7A45') + '</div>' +
        '<div class="perfil__curso peque">' + r.pct + '% completado</div>' +
        '</div>';
    }).join('');

    pintar(
      '<div class="portada"><div class="portada__logo">📚</div><h1>Repaso Cole</h1><p>¿Quién va a repasar hoy?</p></div>' +
      '<div class="perfiles">' + tarjetas + '</div>' +
      '<p class="nota-dispositivo">Toca ✏️ para elegir tu avatar y tu curso.<br>El progreso se guarda en este dispositivo.</p>'
    );
  }

  function vistaInicio() {
    var p = perfilActivo();
    if (!p) return ir('#/');
    var curso = cursoVista(p);
    var todos = temasDe(curso);
    var r = resumen(p.id, todos);

    var ahora = (catalogo.ahora || []).map(tema).filter(Boolean).map(function (t) {
      var a = asignatura(t.asignatura);
      var e = estado(leerProgreso(p.id, t.id));
      return '<a class="tarjeta ahora" href="#/tema/' + t.id + '" style="--c:' + a.color + '">' +
        '<span class="ahora__emoji">' + t.emoji + '</span>' +
        '<span><span class="ahora__etiqueta">Ahora en clase · ' + t.curso + 'º ' + esc(a.nombre) + '</span>' +
        '<span class="ahora__titulo" style="display:block">' + esc(t.titulo) + '</span>' +
        '<span class="peque suave" style="font-weight:700">' + ESTADOS[e].icono + ' ' + ESTADOS[e].texto + '</span></span>' +
        '<span class="ahora__flecha">→</span></a>';
    }).join('');

    var asigs = catalogo.asignaturas.map(function (a) {
      var lista = temasDe(curso, a.id);
      if (!lista.length) return '';
      var ra = resumen(p.id, lista);
      return '<a class="tarjeta asignatura" href="#/asignatura/' + curso + '/' + a.id + '" style="--c:' + a.color + '">' +
        '<span class="asignatura__emoji">' + a.emoji + '</span>' +
        '<span class="asignatura__nombre">' + esc(a.nombre) + '</span>' +
        barraProgreso(ra.pct) +
        '<span class="asignatura__datos">' + ra.aprobados + ' de ' + ra.total + ' temas aprobados</span></a>';
    }).join('');

    var cursos = Object.keys(catalogo.cursos).map(function (c) {
      return '<button class="chip" data-accion="ver-curso" data-curso="' + c + '" aria-pressed="' + (String(curso) === c) + '">' + catalogo.cursos[c] + '</button>';
    }).join('');

    pintar(
      barra('#/', '¡Hola, ' + esc(p.apodo) + '! ' + p.avatar, false) +
      '<div class="tarjeta resumen" style="margin-top:6px">' +
        '<div class="anillo" style="--p:' + r.pct + '"><div class="anillo__dentro">' + r.pct + '%</div></div>' +
        '<div><h2>Tu progreso en ' + curso + 'º</h2>' +
        '<div class="resumen__datos"><span>✅ ' + r.aprobados + ' aprobados</span><span>⭐ ' + r.dominados + ' dominados</span><span>📚 ' + r.total + ' temas</span></div>' +
        '<a href="#/progreso" class="peque" style="font-weight:800;color:var(--c)">Ver mi progreso →</a></div>' +
      '</div>' +
      (ahora ? '<section class="seccion"><h2 class="seccion__titulo">🔥 Lo que estamos dando</h2>' + ahora + '</section>' : '') +
      '<section class="seccion"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px">' +
        '<h2 class="seccion__titulo" style="margin:0">📚 Asignaturas</h2><div class="chips">' + cursos + '</div></div>' +
        '<div class="asignaturas">' + asigs + '</div></section>' +
      '<div class="pie"><button data-accion="cambiar-perfil">Cambiar de perfil</button></div>'
    );
  }

  function vistaAsignatura(curso, asigId) {
    var p = perfilActivo();
    if (!p) return ir('#/');
    var a = asignatura(asigId);
    if (!a) return ir('#/inicio');
    var lista = temasDe(curso, asigId);
    var r = resumen(p.id, lista);
    var ahora = catalogo.ahora || [];

    var items = lista.map(function (t, i) {
      var pr = leerProgreso(p.id, t.id);
      var e = estado(pr);
      var detalle = ESTADOS[e].texto + (pr.mejor != null ? ' · mejor nota ' + nota(pr.mejor) : '');
      return '<li><a class="tarjeta tema' + (ahora.indexOf(t.id) >= 0 ? ' tema--ahora' : '') + '" href="#/tema/' + t.id + '">' +
        '<span class="tema__num">' + t.emoji + '</span>' +
        '<span class="tema__cuerpo"><span class="tema__titulo">' + (i + 1) + '. ' + esc(t.titulo) +
        (ahora.indexOf(t.id) >= 0 ? '<span class="etiqueta-ahora">Ahora</span>' : '') + '</span>' +
        '<span class="tema__estado" style="display:block">' + detalle + '</span></span>' +
        '<span class="tema__icono">' + ESTADOS[e].icono + '</span></a></li>';
    }).join('');

    pintar(
      barra('#/inicio', curso + 'º · ' + esc(a.nombre), true) +
      '<div class="cabecera"><span class="cabecera__emoji">' + a.emoji + '</span><div style="flex:1">' +
        '<h1>' + esc(a.nombre) + '</h1><p>' + r.aprobados + ' de ' + r.total + ' temas aprobados · ' + r.pct + '%</p>' +
        barraProgreso(r.pct) + '</div></div>' +
      '<ul class="temas">' + items + '</ul>',
      a.color
    );
  }

  function vistaTema(id) {
    var p = perfilActivo();
    if (!p) return ir('#/');
    var t = tema(id);
    if (!t) return ir('#/inicio');
    var a = asignatura(t.asignatura);
    var pr = leerProgreso(p.id, t.id);
    var e = estado(pr);
    var volver = '#/asignatura/' + t.curso + '/' + t.asignatura;

    pintar(barra(volver, esc(t.titulo), true) + '<div class="cargando"><span class="cargando__punto"></span>Abriendo apuntes…</div>', a.color);

    cargarTema(t).then(function (c) {
      var fallos = (pr.fallos || []).filter(function (fid) {
        return c.examen.preguntas.some(function (q) { return q.id === fid; });
      });
      pintar(
        barra(volver, esc(t.titulo), true) +
        '<div class="cabecera"><span class="cabecera__emoji">' + t.emoji + '</span><div>' +
          '<p style="margin:0">' + t.curso + 'º · ' + esc(a.nombre) + ' · Tema ' + numeroTema(t) + '</p>' +
          '<h1>' + esc(t.titulo) + '</h1></div></div>' +
        '<div class="pasos">' +
          '<div class="paso ' + (pr.leido ? 'paso--hecho' : 'paso--activo') + '">' + (pr.leido ? '✅' : '1️⃣') + ' Apuntes</div>' +
          '<div class="paso ' + (pr.intentos ? (pr.mejor >= 5 ? 'paso--hecho' : '') : (pr.leido ? 'paso--activo' : '')) + '">' +
            (pr.intentos ? ESTADOS[e].icono + ' Examen: ' + nota(pr.mejor) : '2️⃣ Examen') + '</div>' +
        '</div>' +
        '<article class="tarjeta apuntes">' + c.apuntesHtml + '</article>' +
        '<div class="botones">' +
          '<button class="boton" data-accion="empezar-examen" data-id="' + t.id + '">✏️ ¡Ya lo he estudiado! Hacer el examen</button>' +
          (fallos.length ? '<button class="boton boton--claro" data-accion="repasar-fallos" data-id="' + t.id + '">🔁 Repasar mis ' + fallos.length + ' fallos</button>' : '') +
          '<a class="boton boton--claro" href="' + volver + '">← Volver a los temas</a>' +
        '</div>',
        a.color
      );
      window.scrollTo(0, 0);
    }).catch(function (err) {
      pintar(barra(volver, esc(t.titulo), true) + '<div class="tarjeta vacio">😕 No se han podido cargar los apuntes.<br><span class="peque">' + esc(err.message) + '</span></div>', a.color);
    });
  }

  /* ================= Examen ================= */

  var TIPOS = {
    test: 'Elige la respuesta',
    multiple: 'Elige todas las correctas',
    vf: '¿Verdadero o falso?',
    escribir: 'Escribe la respuesta',
    huecos: 'Completa los huecos',
    ordenar: 'Ordena',
    clasificar: 'Clasifica',
    relacionar: 'Relaciona'
  };

  function iguales(a, b) {
    return a.length === b.length && a.every(function (x, i) { return x === b[i]; });
  }

  // Prepara una copia de la pregunta con el orden aleatorio y el estado de las respuestas.
  function preparar(q) {
    var c = Object.assign({}, q);
    c.estado = {};
    if (q.tipo === 'test' || q.tipo === 'multiple') {
      c.opciones = barajar(q.correctas.concat(q.incorrectas));
      c.estado.elegidas = [];
    } else if (q.tipo === 'ordenar') {
      var piezas = barajar(q.orden);
      for (var n = 0; n < 5 && iguales(piezas, q.orden); n++) piezas = barajar(q.orden);
      c.piezas = piezas;
      c.estado.secuencia = [];
    } else if (q.tipo === 'clasificar') {
      var items = [];
      q.categorias.forEach(function (cat, k) { cat.elementos.forEach(function (e) { items.push({ texto: e, cat: k }); }); });
      c.items = barajar(items);
      c.estado.asignado = {};
    } else if (q.tipo === 'relacionar') {
      c.izquierdas = barajar(q.pares);
      c.derechas = barajar(q.pares.map(function (x) { return x.der; }));
      c.estado.sel = {};
    } else if (q.tipo === 'huecos') {
      c.segmentos = q.texto.split(/\[[^\]]+\]/);
      if (q.conMenu) {
        var pal = q.huecos.map(function (h) { return h[0]; }).concat(q.incorrectas);
        c.menu = barajar(pal.filter(function (x, i) { return pal.indexOf(x) === i; }));
      }
      c.estado.valores = [];
    }
    return c;
  }

  function solucionTexto(q) {
    switch (q.tipo) {
      case 'test': return q.correctas[0];
      case 'multiple': return q.correctas.join(' · ');
      case 'vf': return q.valor ? 'Verdadero' : 'Falso';
      case 'escribir': return q.respuestas[0];
      case 'ordenar': return q.orden.join(' → ');
      case 'clasificar': return q.categorias.map(function (c) { return '**' + c.nombre + ':** ' + c.elementos.join(', '); }).join(' · ');
      case 'relacionar': return q.pares.map(function (x) { return x.izq + ' → ' + x.der; }).join(' · ');
      case 'huecos':
        var k = 0;
        return q.texto.replace(/\[[^\]]+\]/g, function () { return '**' + q.huecos[k++][0] + '**'; });
    }
    return '';
  }

  function textoPregunta(q) {
    return q.tipo === 'huecos' ? q.texto.replace(/\[[^\]]+\]/g, '___') : q.texto;
  }

  function empezarExamen(id, soloFallos) {
    var p = perfilActivo();
    var t = tema(id);
    cargarTema(t).then(function (c) {
      var validas = c.examen.preguntas.filter(function (q) { return q.tipo !== 'error'; });
      var elegidas;
      if (soloFallos) {
        var f = leerProgreso(p.id, id).fallos || [];
        elegidas = barajar(validas.filter(function (q) { return f.indexOf(q.id) >= 0; }));
      } else {
        elegidas = barajar(validas).slice(0, c.examen.config.preguntas || 20);
      }
      if (!elegidas.length) return ir('#/tema/' + id);
      if (!soloFallos) { progresoDe(p.id, id).leido = true; guardar(); }
      sesion = {
        temaId: id,
        repaso: !!soloFallos,
        preguntas: elegidas.map(preparar),
        i: 0,
        aciertos: 0,
        respuestas: [],
        respondida: null
      };
      if (location.hash === '#/examen/' + id) vistaExamen(id); else ir('#/examen/' + id);
    });
  }

  function botonComprobar(activo) {
    return '<div class="botones"><button class="boton" data-accion="comprobar"' + (activo ? '' : ' disabled') + '>Comprobar ✔</button></div>';
  }

  function cuerpoPregunta(q, r) {
    var letras = 'ABCDEFGH';
    var e = q.estado;

    if (q.tipo === 'test') {
      return '<div class="opciones">' + q.opciones.map(function (op, k) {
        var clase = '';
        if (r) {
          if (op === q.correctas[0]) clase = ' opcion--bien';
          else if (op === r.tuya) clase = ' opcion--mal';
        }
        return '<button class="opcion' + clase + '" data-accion="responder" data-valor="' + esc(op) + '"' + (r ? ' disabled' : '') + '>' +
          '<span class="opcion__letra">' + letras[k] + '</span><span>' + F.enLinea(op) + '</span></button>';
      }).join('') + '</div>';
    }

    if (q.tipo === 'multiple') {
      return '<div class="opciones">' + q.opciones.map(function (op, k) {
        var elegida = e.elegidas.indexOf(op) >= 0;
        var correcta = q.correctas.indexOf(op) >= 0;
        var clase = elegida ? ' opcion--elegida' : '';
        if (r) clase = correcta ? (elegida ? ' opcion--bien' : ' opcion--falta') : (elegida ? ' opcion--mal' : '');
        return '<button class="opcion' + clase + '" data-accion="marcar" data-k="' + k + '" aria-pressed="' + elegida + '"' + (r ? ' disabled' : '') + '>' +
          '<span class="opcion__letra opcion__casilla">' + (elegida ? '✓' : '') + '</span><span>' + F.enLinea(op) + '</span></button>';
      }).join('') + '</div>' + (r ? '' : botonComprobar(e.elegidas.length > 0));
    }

    if (q.tipo === 'vf') {
      return '<div class="opciones opciones--vf">' + [['true', '👍', 'Verdadero'], ['false', '👎', 'Falso']].map(function (o) {
        var clase = '';
        if (r) {
          if (String(q.valor) === o[0]) clase = ' opcion--bien';
          else if (r.tuya === o[0]) clase = ' opcion--mal';
        }
        return '<button class="opcion' + clase + '" data-accion="responder" data-valor="' + o[0] + '"' + (r ? ' disabled' : '') + '><span>' + o[1] + '</span><span>' + o[2] + '</span></button>';
      }).join('') + '</div>';
    }

    if (q.tipo === 'escribir') {
      return '<form class="escribir" data-accion="escribir">' +
        '<input type="text" name="r" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí tu respuesta" ' +
        (r ? 'value="' + esc(r.tuya) + '" disabled' : 'autofocus') + '>' +
        (r ? '' : '<button class="boton" type="submit">OK</button>') + '</form>';
    }

    if (q.tipo === 'ordenar') {
      var huecos = q.piezas.map(function (_, pos) {
        var k = e.secuencia[pos];
        var hay = k !== undefined;
        var clase = '';
        if (r && hay) clase = q.piezas[k] === q.orden[pos] ? ' ranura--bien' : ' ranura--mal';
        return '<li class="ranura' + (hay ? ' ranura--llena' : '') + clase + '">' +
          '<span class="ranura__num">' + (pos + 1) + '</span>' +
          (hay ? '<button class="ranura__pieza" data-accion="quitar" data-pos="' + pos + '"' + (r ? ' disabled' : '') + '>' + F.enLinea(q.piezas[k]) + (r ? '' : ' <span aria-hidden="true">✕</span>') + '</button>'
               : '<span class="ranura__vacia">Toca una pieza</span>') + '</li>';
      }).join('');
      var libres = q.piezas.map(function (txt, k) {
        if (e.secuencia.indexOf(k) >= 0) return '';
        return '<button class="pieza" data-accion="pieza" data-k="' + k + '">' + F.enLinea(txt) + '</button>';
      }).join('');
      return '<ol class="ranuras">' + huecos + '</ol>' +
        (r ? '' : '<div class="piezas">' + libres + '</div>' + botonComprobar(e.secuencia.length === q.piezas.length));
    }

    if (q.tipo === 'clasificar') {
      return '<div class="clasif">' + q.items.map(function (it, k) {
        var elegido = e.asignado[k];
        var clase = '';
        if (r) clase = elegido === it.cat ? ' clasif__item--bien' : ' clasif__item--mal';
        return '<div class="clasif__item' + clase + '"><div class="clasif__texto">' + F.enLinea(it.texto) +
          (r && elegido !== it.cat ? ' <span class="clasif__sol">→ ' + esc(q.categorias[it.cat].nombre) + '</span>' : '') + '</div>' +
          '<div class="clasif__cats">' + q.categorias.map(function (cat, ci) {
            return '<button class="chip" data-accion="categoria" data-item="' + k + '" data-cat="' + ci + '" aria-pressed="' + (elegido === ci) + '"' + (r ? ' disabled' : '') + '>' + esc(cat.nombre) + '</button>';
          }).join('') + '</div></div>';
      }).join('') + '</div>' + (r ? '' : botonComprobar(Object.keys(e.asignado).length === q.items.length));
    }

    if (q.tipo === 'relacionar') {
      return '<div class="relac">' + q.izquierdas.map(function (par, k) {
        var sel = e.sel[k] || '';
        var clase = r ? (sel === par.der ? ' relac__fila--bien' : ' relac__fila--mal') : '';
        return '<label class="relac__fila' + clase + '"><span class="relac__izq">' + F.enLinea(par.izq) + '</span>' +
          '<select data-par="' + k + '"' + (r ? ' disabled' : '') + '><option value="">Elige…</option>' +
          q.derechas.map(function (d) { return '<option' + (d === sel ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') +
          '</select>' + (r && sel !== par.der ? '<span class="relac__sol">✔ ' + esc(par.der) + '</span>' : '') + '</label>';
      }).join('') + '</div>' + (r ? '' : botonComprobar(Object.keys(e.sel).filter(function (k) { return e.sel[k]; }).length === q.izquierdas.length));
    }

    if (q.tipo === 'huecos') {
      var html = '';
      q.segmentos.forEach(function (seg, k) {
        html += F.enLinea(seg);
        if (k >= q.huecos.length) return;
        var v = e.valores[k] || '';
        var clase = r ? (r.detalle[k] ? ' hueco--bien' : ' hueco--mal') : '';
        if (q.conMenu) {
          html += '<select class="hueco' + clase + '" data-hueco="' + k + '"' + (r ? ' disabled' : '') + '><option value="">…</option>' +
            q.menu.map(function (w) { return '<option' + (w === v ? ' selected' : '') + '>' + esc(w) + '</option>'; }).join('') + '</select>';
        } else {
          html += '<input class="hueco' + clase + '" data-hueco="' + k + '" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(v) + '"' + (r ? ' disabled' : '') + '>';
        }
      });
      return '<form class="huecos" data-accion="huecos"><p class="huecos__texto">' + html + '</p>' +
        (r ? '' : '<div class="botones"><button class="boton" type="submit">Comprobar ✔</button></div>') + '</form>';
    }
    return '';
  }

  function vistaExamen(id) {
    var t = tema(id);
    if (!t || !sesion || sesion.temaId !== id) return ir('#/tema/' + id);
    var a = asignatura(t.asignatura);
    if (sesion.i >= sesion.preguntas.length) return vistaResultado();

    var q = sesion.preguntas[sesion.i];
    var r = sesion.respondida;
    var total = sesion.preguntas.length;

    var feedback = '';
    if (r) {
      feedback = '<div class="respuesta ' + (r.ok ? 'respuesta--bien' : 'respuesta--mal') + '">' +
        '<div class="respuesta__titulo">' + (r.ok ? '¡Correcto! 🎉' : 'Casi… 💪') + '</div>' +
        (r.ok ? '' : '<p><strong>Respuesta correcta:</strong> ' + F.enLinea(solucionTexto(q)) + '</p>') +
        (q.explicacion ? '<p>' + F.enLinea(q.explicacion) + '</p>' : '') + '</div>' +
        '<div class="botones"><button class="boton" data-accion="siguiente">' + (sesion.i + 1 < total ? 'Siguiente →' : 'Ver mi nota 🏁') + '</button></div>';
    }

    var scroll = window.scrollY;
    pintar(
      barra('#/tema/' + id, (sesion.repaso ? '🔁 Repaso · ' : '✏️ Examen · ') + esc(t.titulo), false) +
      '<div class="examen__cabeza"><span>' + (sesion.i + 1) + '/' + total + '</span>' + barraProgreso(Math.round((sesion.i / total) * 100)) + '<span>✅ ' + sesion.aciertos + '</span></div>' +
      '<div class="tarjeta pregunta"><div class="pregunta__tipo">' + TIPOS[q.tipo] + '</div>' +
      (q.tipo === 'huecos' ? '' : '<div class="pregunta__texto">' + F.enLinea(q.texto) + '</div>') +
      cuerpoPregunta(q, r) + feedback + '</div>',
      a.color
    );
    window.scrollTo(0, scroll);
    if (!r && q.tipo === 'escribir') {
      var inp = app.querySelector('input');
      if (inp) inp.focus();
    }
  }

  function registrar(q, ok, tuya, detalle) {
    if (ok) sesion.aciertos++;
    sesion.respondida = { tuya: tuya, ok: ok, detalle: detalle };
    sesion.respuestas.push({ q: q, ok: ok, tuya: tuya });
    vistaExamen(sesion.temaId);
    var fb = app.querySelector('.respuesta');
    if (fb && fb.scrollIntoView) fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function responder(valor) {
    if (!sesion || sesion.respondida) return;
    var q = sesion.preguntas[sesion.i];
    var ok;
    if (q.tipo === 'test') ok = valor === q.correctas[0];
    else if (q.tipo === 'vf') ok = String(q.valor) === valor;
    else ok = F.comprobarEscrita(q, valor);
    registrar(q, ok, valor);
  }

  function comprobar() {
    if (!sesion || sesion.respondida) return;
    var q = sesion.preguntas[sesion.i];
    var e = q.estado;
    var ok, tuya, detalle;
    if (q.tipo === 'multiple') {
      ok = e.elegidas.length === q.correctas.length && e.elegidas.every(function (x) { return q.correctas.indexOf(x) >= 0; });
      tuya = e.elegidas.join(' · ');
    } else if (q.tipo === 'ordenar') {
      var orden = e.secuencia.map(function (k) { return q.piezas[k]; });
      ok = iguales(orden, q.orden);
      tuya = orden.join(' → ');
    } else if (q.tipo === 'clasificar') {
      ok = q.items.every(function (it, k) { return e.asignado[k] === it.cat; });
      tuya = q.items.map(function (it, k) { return it.texto + ' → ' + (e.asignado[k] !== undefined ? q.categorias[e.asignado[k]].nombre : '?'); }).join(' · ');
    } else if (q.tipo === 'relacionar') {
      ok = q.izquierdas.every(function (par, k) { return e.sel[k] === par.der; });
      tuya = q.izquierdas.map(function (par, k) { return par.izq + ' → ' + (e.sel[k] || '?'); }).join(' · ');
    } else if (q.tipo === 'huecos') {
      app.querySelectorAll('[data-hueco]').forEach(function (el) { e.valores[Number(el.dataset.hueco)] = el.value; });
      detalle = q.huecos.map(function (h, k) {
        var v = e.valores[k] || '';
        return q.conMenu ? h.indexOf(v) >= 0 : F.comprobarEscrita({ respuestas: h }, v);
      });
      ok = detalle.every(Boolean);
      tuya = q.huecos.map(function (_, k) { return e.valores[k] || '(en blanco)'; }).join(' · ');
    } else return;
    registrar(q, ok, tuya, detalle);
  }

  function interaccion(acc, el) {
    if (!sesion || sesion.respondida) return;
    var q = sesion.preguntas[sesion.i];
    var e = q.estado;
    if (acc === 'marcar') {
      var op = q.opciones[Number(el.dataset.k)];
      var i = e.elegidas.indexOf(op);
      if (i >= 0) e.elegidas.splice(i, 1); else e.elegidas.push(op);
    } else if (acc === 'pieza') {
      e.secuencia.push(Number(el.dataset.k));
    } else if (acc === 'quitar') {
      e.secuencia.splice(Number(el.dataset.pos), 1);
    } else if (acc === 'categoria') {
      e.asignado[Number(el.dataset.item)] = Number(el.dataset.cat);
    }
    vistaExamen(sesion.temaId);
  }

  function vistaResultado() {
    var p = perfilActivo();
    var t = tema(sesion.temaId);
    var a = asignatura(t.asignatura);
    var total = sesion.preguntas.length;
    var n = (sesion.aciertos / total) * 10;

    if (!sesion.guardado) {
      var pr = progresoDe(p.id, t.id);
      var falladas = sesion.respuestas.filter(function (x) { return !x.ok; }).map(function (x) { return x.q.id; });
      if (sesion.repaso) {
        var acertadas = sesion.respuestas.filter(function (x) { return x.ok; }).map(function (x) { return x.q.id; });
        pr.fallos = (pr.fallos || []).filter(function (fid) { return acertadas.indexOf(fid) < 0; });
      } else {
        pr.leido = true;
        pr.intentos = (pr.intentos || 0) + 1;
        pr.ultima = n;
        pr.mejor = Math.max(pr.mejor || 0, n);
        pr.fecha = new Date().toISOString();
        pr.fallos = falladas;
        var h = datos.historial[p.id] || (datos.historial[p.id] = []);
        h.unshift({ tema: t.id, nota: n, fecha: pr.fecha });
        datos.historial[p.id] = h.slice(0, 40);
      }
      guardar();
      sesion.guardado = true;
      if (n >= 9) setTimeout(confeti, 150);
    }

    var estrellas = n >= 9 ? '⭐⭐⭐' : n >= 7 ? '⭐⭐☆' : n >= 5 ? '⭐☆☆' : '☆☆☆';
    var mensaje = n === 10 ? '¡Perfecto! Eres un crack 🏆' : n >= 9 ? '¡Excelente trabajo! 🎉' : n >= 7 ? '¡Muy bien! Ya casi lo dominas 👏' :
      n >= 5 ? '¡Aprobado! Repasa los fallos y sube nota 💪' : 'Vuelve a leer los apuntes y lo intentamos otra vez 📖';

    var fallos = sesion.respuestas.filter(function (x) { return !x.ok; }).map(function (x) {
      var q = x.q;
      var tuya = q.tipo === 'vf' ? (x.tuya === 'true' ? 'Verdadero' : 'Falso') : x.tuya;
      return '<li class="tarjeta fallo"><div class="fallo__pregunta">' + F.enLinea(textoPregunta(q)) + '</div>' +
        '<div class="fallo__bien">✔ ' + F.enLinea(solucionTexto(q)) + '</div>' +
        '<div class="fallo__tuya">✘ Tu respuesta: ' + esc(tuya || '(en blanco)') + '</div>' +
        (q.explicacion ? '<p>' + F.enLinea(q.explicacion) + '</p>' : '') + '</li>';
    }).join('');

    var lista = temasDe(t.curso, t.asignatura);
    var siguiente = lista[lista.indexOf(t) + 1];

    pintar(
      barra('#/tema/' + t.id, (sesion.repaso ? 'Repaso · ' : 'Nota · ') + esc(t.titulo), true) +
      '<div class="tarjeta resultado"><div class="resultado__estrellas">' + estrellas + '</div>' +
        '<div class="resultado__nota">' + nota(n) + '<small> / 10</small></div>' +
        '<div class="suave" style="font-weight:700">' + sesion.aciertos + ' de ' + total + ' respuestas correctas</div>' +
        '<div class="resultado__mensaje">' + (sesion.repaso ? (sesion.aciertos === total ? '¡Fallos corregidos! 🎯' : '¡Sigue practicando! 💪') : mensaje) + '</div></div>' +
      (fallos ? '<section class="seccion"><h2 class="seccion__titulo">🔍 Repasa estas preguntas</h2><ul class="fallos">' + fallos + '</ul></section>' : '') +
      '<div class="botones">' +
        (fallos ? '<button class="boton" data-accion="repasar-fallos" data-id="' + t.id + '">🔁 Repetir solo los fallos</button>' : '') +
        '<button class="boton' + (fallos ? ' boton--claro' : '') + '" data-accion="empezar-examen" data-id="' + t.id + '">✏️ Hacer otro examen</button>' +
        '<a class="boton boton--claro" href="#/tema/' + t.id + '">📖 Volver a los apuntes</a>' +
        (siguiente ? '<a class="boton boton--claro" href="#/tema/' + siguiente.id + '">Siguiente tema: ' + siguiente.emoji + ' ' + esc(siguiente.titulo) + '</a>' : '') +
      '</div>',
      a.color
    );
    window.scrollTo(0, 0);
  }

  function vistaProgreso() {
    var p = perfilActivo();
    if (!p) return ir('#/');
    var todos = catalogo.temas;
    var r = resumen(p.id, todos);
    var hist = datos.historial[p.id] || [];

    var bloques = Object.keys(catalogo.cursos).map(function (c) {
      var curso = Number(c);
      var filas = catalogo.asignaturas.map(function (a) {
        var lista = temasDe(curso, a.id);
        if (!lista.length) return '';
        var ra = resumen(p.id, lista);
        return '<a href="#/asignatura/' + curso + '/' + a.id + '" style="display:block;text-decoration:none;color:inherit;margin-top:12px">' +
          '<div style="display:flex;justify-content:space-between;font-weight:800"><span>' + a.emoji + ' ' + esc(a.nombre) + '</span><span>' + ra.pct + '%</span></div>' +
          barraProgreso(ra.pct, a.color) +
          '<div class="peque suave" style="font-weight:700;margin-top:2px">✅ ' + ra.aprobados + '/' + ra.total + ' aprobados · ⭐ ' + ra.dominados + ' dominados</div></a>';
      }).join('');
      return '<section class="seccion"><h2 class="seccion__titulo">' + catalogo.cursos[c] + ' de Primaria</h2><div class="tarjeta">' + filas + '</div></section>';
    }).join('');

    var lineas = hist.slice(0, 15).map(function (h) {
      var t = tema(h.tema);
      if (!t) return '';
      var f = new Date(h.fecha);
      return '<li class="tarjeta"><span style="font-size:1.4rem">' + t.emoji + '</span><span><strong>' + esc(t.titulo) + '</strong><br>' +
        '<span class="peque suave">' + f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' · ' + t.curso + 'º</span></span>' +
        '<span class="historial__nota" style="color:' + (h.nota >= 5 ? 'var(--bien)' : 'var(--mal)') + '">' + nota(h.nota) + '</span></li>';
    }).join('');

    var examenes = hist.length;

    pintar(
      barra('#/inicio', 'Mi progreso', false) +
      '<div class="tarjeta resumen" style="margin-top:6px;--pc:' + p.color + '">' +
        '<div class="perfil__cara" style="width:72px;height:72px;font-size:2.4rem;margin:0">' + p.avatar + '</div>' +
        '<div><h2>' + esc(p.apodo) + '</h2><div class="suave" style="font-weight:700">' + p.curso + 'º de Primaria</div>' +
        '<button class="chip" style="margin-top:6px" data-accion="editar-perfil" data-id="' + p.id + '">✏️ Cambiar avatar o curso</button></div></div>' +
      '<div class="medallas seccion">' +
        '<div class="tarjeta medalla"><div class="medalla__num">⭐ ' + r.dominados + '</div><div class="medalla__txt">temas dominados</div></div>' +
        '<div class="tarjeta medalla"><div class="medalla__num">✅ ' + r.aprobados + '</div><div class="medalla__txt">temas aprobados</div></div>' +
        '<div class="tarjeta medalla"><div class="medalla__num">✏️ ' + examenes + '</div><div class="medalla__txt">exámenes hechos</div></div>' +
      '</div>' +
      bloques +
      '<section class="seccion"><h2 class="seccion__titulo">🕒 Últimos exámenes</h2>' +
        (lineas ? '<ul class="historial">' + lineas + '</ul>' : '<div class="tarjeta vacio">Todavía no has hecho ningún examen.<br>¡Empieza por un tema! 🚀</div>') +
      '</section>' +
      '<div class="pie"><button data-accion="cambiar-perfil">Cambiar de perfil</button> · <button data-accion="borrar-progreso">Borrar mi progreso</button></div>'
    );
  }

  function dialogoPerfil(id) {
    var p = datos.perfiles.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var elegido = p.avatar;
    var cursoElegido = p.curso;
    var velo = document.createElement('div');
    velo.className = 'velo';
    velo.innerHTML = '<div class="dialogo" role="dialog" aria-modal="true" aria-label="Editar perfil">' +
      '<h2>' + p.avatar + ' Mi perfil</h2>' +
      '<div class="campo"><label for="apodo">Apodo (opcional)</label><input type="text" id="apodo" maxlength="14" value="' + esc(p.apodo) + '"></div>' +
      '<div class="campo"><span>Avatar</span><div class="avatares">' + AVATARES.map(function (av) {
        return '<button type="button" data-av="' + av + '" aria-pressed="' + (av === elegido) + '">' + av + '</button>';
      }).join('') + '</div></div>' +
      '<div class="campo"><span>Mi curso</span><div class="chips">' + Object.keys(catalogo.cursos).map(function (c) {
        return '<button type="button" class="chip" data-cu="' + c + '" aria-pressed="' + (String(cursoElegido) === c) + '">' + catalogo.cursos[c] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="botones"><button class="boton" data-ok>Guardar</button><button class="boton boton--claro" data-no>Cancelar</button></div></div>';
    document.body.appendChild(velo);

    velo.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (ev.target === velo || (b && b.hasAttribute('data-no'))) { velo.remove(); return; }
      if (!b) return;
      if (b.dataset.av) {
        elegido = b.dataset.av;
        velo.querySelectorAll('[data-av]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      } else if (b.dataset.cu) {
        cursoElegido = Number(b.dataset.cu);
        velo.querySelectorAll('[data-cu]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      } else if (b.hasAttribute('data-ok')) {
        var apodo = velo.querySelector('#apodo').value.trim();
        p.apodo = apodo || (p.id === 'nina' ? 'Niña' : 'Niño');
        p.avatar = elegido;
        p.curso = cursoElegido;
        delete datos.vista[p.id];
        guardar();
        velo.remove();
        render();
      }
    });
  }

  /* ================= Eventos ================= */

  app.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-accion]');
    if (!el) return;
    var acc = el.dataset.accion;
    if (acc === 'editar-perfil') { ev.stopPropagation(); dialogoPerfil(el.dataset.id); return; }
    if (acc === 'elegir-perfil') { datos.activo = el.dataset.id; guardar(); ir('#/inicio'); return; }
    if (acc === 'cambiar-perfil') { datos.activo = null; guardar(); ir('#/'); return; }
    if (acc === 'ver-curso') { datos.vista[datos.activo] = Number(el.dataset.curso); guardar(); render(); return; }
    if (acc === 'empezar-examen') { empezarExamen(el.dataset.id, false); return; }
    if (acc === 'repasar-fallos') { empezarExamen(el.dataset.id, true); return; }
    if (acc === 'responder') { responder(el.dataset.valor); return; }
    if (acc === 'comprobar') { comprobar(); return; }
    if (acc === 'marcar' || acc === 'pieza' || acc === 'quitar' || acc === 'categoria') { interaccion(acc, el); return; }
    if (acc === 'siguiente') { sesion.i++; sesion.respondida = null; vistaExamen(sesion.temaId); window.scrollTo(0, 0); return; }
    if (acc === 'borrar-progreso') {
      if (confirm('¿Seguro que quieres borrar todo tu progreso? No se puede deshacer.')) {
        datos.progreso[datos.activo] = {};
        datos.historial[datos.activo] = [];
        guardar();
        render();
      }
    }
  });

  app.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.matches('.perfil')) ev.target.click();
  });

  app.addEventListener('change', function (ev) {
    var el = ev.target;
    if (!sesion || sesion.respondida) return;
    var q = sesion.preguntas[sesion.i];
    if (el.dataset.par !== undefined) { q.estado.sel[Number(el.dataset.par)] = el.value; vistaExamen(sesion.temaId); }
    else if (el.dataset.hueco !== undefined) { q.estado.valores[Number(el.dataset.hueco)] = el.value; }
  });

  app.addEventListener('input', function (ev) {
    var el = ev.target;
    if (sesion && !sesion.respondida && el.dataset.hueco !== undefined) sesion.preguntas[sesion.i].estado.valores[Number(el.dataset.hueco)] = el.value;
  });

  app.addEventListener('submit', function (ev) {
    if (ev.target.dataset.accion === 'huecos') { ev.preventDefault(); comprobar(); return; }
    if (ev.target.dataset.accion === 'escribir') {
      ev.preventDefault();
      var v = ev.target.querySelector('input').value;
      if (v.trim()) responder(v);
    }
  });

  /* ================= Rutas ================= */

  function render() {
    var partes = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    var ruta = partes[0];
    if (ruta !== 'examen') sesion = null;
    if (ruta !== '' && !perfilActivo()) return vistaPerfiles();
    if (ruta === '') return vistaPerfiles();
    if (ruta === 'inicio') return vistaInicio();
    if (ruta === 'asignatura') return vistaAsignatura(Number(partes[1]), partes[2]);
    if (ruta === 'tema') return vistaTema(partes[1]);
    if (ruta === 'examen') return vistaExamen(partes[1]);
    if (ruta === 'progreso') return vistaProgreso();
    vistaInicio();
  }

  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

  fetch('contenido/indice.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (c) {
      catalogo = c;
      if (!location.hash && perfilActivo()) location.replace('#/inicio');
      render();
    })
    .catch(function () {
      app.innerHTML = '<div class="tarjeta vacio" style="margin-top:40px">😕 No se ha podido cargar el temario.<br>Comprueba la conexión y vuelve a intentarlo.</div>';
    });
})();
