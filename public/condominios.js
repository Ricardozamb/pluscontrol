/* ============================================================================
   MÓDULO: PLAN DE EMERGENCIA Y EVACUACIÓN PARA CONDOMINIOS — v2 (AUDITADO)
   Plus Control SpA — tipo de documento: emergencia_condominio
   Base legal: Ley 21.442 Art. 40 + Reglamento MINVU (D.O. 09-01-2025)

   CORRECCIONES v2:
   1. Generación POR PARTES (5 llamadas) — max_tokens del servidor es 8192 y
      una sola llamada truncaba el documento a media frase.
   2. Envía su PROPIO system prompt — el servidor inyectaba el SYSTEM de
      empresas (DS 44/2024, Ley Karin) y contaminaba el marco legal.
      REQUIERE el parche de server.js que acepta { system }.
   3. Integración por clase "on" igual que goTab — v1 usaba display inline con
      IDs equivocados y dejaba el resto de la app en blanco permanentemente.
   4. Tema oscuro alineado a las variables CSS de la app.
   5. Tablas markdown convertidas a <table> real en el PDF.
   6. Se preserva el plan generado al editar el condominio.
   7. localStorage con manejo de cuota.

   INTEGRACIÓN — en public/index.html, antes de </body>:
       <script src="app.js"></script>
       <script src="condominios.js"></script>
   ============================================================================ */

(function () {
  'use strict';

  // ── ALMACENAMIENTO ─────────────────────────────────────────────────────────
  var condos = [];
  try { condos = JSON.parse(localStorage.getItem('pc_condominios') || '[]'); } catch (e) { condos = []; }

  function saveCondos() {
    try {
      localStorage.setItem('pc_condominios', JSON.stringify(condos));
      return true;
    } catch (err) {
      // Cuota excedida: lo más pesado son los planes generados. Se purgan los
      // textos más antiguos conservando siempre el levantamiento de datos.
      var conPlan = condos.filter(function (c) { return c.ultimo_plan; })
        .sort(function (a, b) { return (a.ultimo_plan.fecha || 0) - (b.ultimo_plan.fecha || 0); });
      while (conPlan.length) {
        delete conPlan.shift().ultimo_plan;
        try { localStorage.setItem('pc_condominios', JSON.stringify(condos)); return true; } catch (e2) {}
      }
      alert('No hay espacio de almacenamiento en este dispositivo. Exporta un respaldo y libera espacio.');
      return false;
    }
  }

  function exportarJSON() {
    var b = new Blob([JSON.stringify({ condominios: condos }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'condominios-pluscontrol-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function v(id, def) { var el = document.getElementById(id); return el ? (el.value.trim() || def || '') : (def || ''); }
  function chk(id) { var el = document.getElementById(id); return el && el.checked ? 'Sí' : 'No'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x];
    });
  }
  var REQ_CONDO = ['c-nombre', 'c-dir', 'c-comuna', 'c-region'];

  // ── CONSTRUCTORES DE CAMPOS ────────────────────────────────────────────────
  function seccion(t) { return '<div class="cq-sec">' + t + '</div>'; }
  function grid(campos) { return '<div class="cq-grid">' + campos.join('') + '</div>'; }
  function campo(label, id, value, type, ph) {
    return '<div class="cq-field"><label>' + label + '</label>' +
      '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(value) + '" placeholder="' + esc(ph) + '"></div>';
  }
  function textareaCampo(label, id, value, ph, full) {
    return '<div class="cq-field' + (full === false ? '' : ' cq-full') + '"><label>' + label + '</label>' +
      '<textarea id="' + id + '" rows="2" placeholder="' + esc(ph) + '">' + esc(value) + '</textarea></div>';
  }
  function selectCampo(label, id, opts, cur) {
    var o = opts.map(function (op) {
      return '<option value="' + esc(op[1]) + '"' + (cur === op[1] ? ' selected' : '') + '>' + esc(op[0]) + '</option>';
    }).join('');
    return '<div class="cq-field"><label>' + label + '</label><select id="' + id + '">' + o + '</select></div>';
  }
  function check(id, label, checked) {
    return '<label class="cq-check"><input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '> ' + label + '</label>';
  }

  // ── CUESTIONARIO DE LEVANTAMIENTO ──────────────────────────────────────────
  function renderCuestionario(editId) {
    var e = editId ? condos.find(function (x) { return x.id === editId; }) : null;
    var d = e || {}, nuevo = !e;
    function val(k) { return d[k] != null ? d[k] : ''; }
    // En alta nueva se aplica el valor por defecto; al editar se respeta lo guardado.
    function ck(k, defNuevo) { return nuevo ? !!defNuevo : d[k] === 'Sí'; }

    var host = document.getElementById('pg-condos');
    if (!host) return;

    host.innerHTML =
      '<div class="cq-wrap">' +
      '<div class="cq-head">' +
        '<h2>' + (e ? 'Editar' : 'Nuevo') + ' levantamiento</h2>' +
        '<p class="cq-sub">Datos para el Plan de Emergencia y Evacuación (Ley 21.442, Art. 40). Los campos con * son obligatorios. ' +
        'Lo que no sepas ahora, déjalo vacío: el documento lo marcará como <strong>pendiente de levantamiento</strong>, nunca inventado.</p>' +
      '</div>' +

      seccion('A. Identificación del condominio') +
      grid([
        campo('Nombre del condominio *', 'c-nombre', val('nombre'), 'text', 'Ej: Condominio Parque Oriente'),
        campo('RUT de la comunidad', 'c-rut', val('rut'), 'text', 'Ej: 65.123.456-7'),
      ]) +
      grid([
        campo('Dirección *', 'c-dir', val('direccion'), 'text', 'Ej: Santiago Rosas 2401'),
        campo('Comuna *', 'c-comuna', val('comuna'), 'text', 'Ej: Osorno'),
      ]) +
      grid([
        campo('Región *', 'c-region', val('region') || 'Los Lagos', 'text', ''),
        campo('Rol de avalúo', 'c-rol', val('rol'), 'text', 'Si aplica'),
      ]) +
      grid([
        selectCampo('Tipo de condominio', 'c-tipo', [
          ['Tipo A — unidades en terreno común', 'Tipo A'],
          ['Tipo B — edificios', 'Tipo B'],
          ['Mixto', 'Mixto'],
        ], d.tipo),
        selectCampo('Situación del plan', 'c-situacion', [
          ['Actualización (condominio existente)', 'actualizacion'],
          ['Primer plan (condominio nuevo)', 'primer_plan'],
        ], d.situacion),
      ]) +
      grid([
        campo('Fecha de elaboración', 'c-fecha', val('fecha_elab'), 'date', ''),
        campo('Actualización anterior', 'c-fecha-ant', val('fecha_ant'), 'date', ''),
      ]) +
      selectCampo('¿Comuna costera? — define si se desarrolla el escenario de tsunami', 'c-costera', [
        ['No — se excluye el escenario de tsunami', 'No'],
        ['Sí — se desarrolla procedimiento de tsunami', 'Sí'],
      ], d.costera) +

      seccion('B. Configuración física') +
      grid([
        campo('N° de torres / blocks', 'c-torres', val('torres'), 'text', 'Ej: 3'),
        campo('Identificación de torres', 'c-torres-id', val('torres_id'), 'text', 'Ej: Torre A, B, C'),
      ]) +
      grid([
        campo('N° de pisos por torre', 'c-pisos', val('pisos'), 'text', 'Ej: 6'),
        campo('N° total de unidades', 'c-unidades', val('unidades'), 'text', 'Ej: 210'),
      ]) +
      grid([
        campo('Superficie aproximada (m²)', 'c-superficie', val('superficie'), 'text', ''),
        campo('N° de estacionamientos', 'c-estac', val('estac'), 'text', ''),
      ]) +
      grid([
        campo('Estacionamientos subterráneos', 'c-estac-sub', val('estac_sub'), 'text', ''),
        campo('Estacionamientos de superficie', 'c-estac-sup', val('estac_sup'), 'text', ''),
      ]) +
      textareaCampo('Recintos críticos', 'c-recintos', val('recintos'), 'Bodegas, sala eléctrica, sala de bombas, calderas, sala de basura, generadores…') +
      textareaCampo('Áreas comunes relevantes', 'c-areas', val('areas'), 'Quincho, gimnasio, sala multiuso, piscina…') +

      seccion('C. Sistemas de seguridad y emergencia') +
      '<p class="cq-note">Indica cantidad, ubicación y estado si los conoces. Lo que no exista o no sepas, déjalo vacío.</p>' +
      textareaCampo('Extintores', 'c-extintores', val('extintores'), 'Ej: 24 PQS 6kg, uno por piso en cada torre') +
      grid([
        textareaCampo('Red húmeda', 'c-red-humeda', val('red_humeda'), 'Ubicación / estado', false),
        textareaCampo('Red seca', 'c-red-seca', val('red_seca'), 'Ubicación / estado', false),
      ]) +
      grid([
        textareaCampo('Grifos / bocas de incendio', 'c-grifos', val('grifos'), 'Ubicación', false),
        textareaCampo('Detectores de humo', 'c-detectores', val('detectores'), 'Cobertura', false),
      ]) +
      grid([
        textareaCampo('Sistema de alarma', 'c-alarma', val('alarma'), 'Tipo / cobertura', false),
        textareaCampo('Pulsadores manuales', 'c-pulsadores', val('pulsadores'), 'Ubicación', false),
      ]) +
      grid([
        textareaCampo('Iluminación de emergencia', 'c-ilum', val('ilum'), 'Ubicación', false),
        textareaCampo('Grupo electrógeno / respaldo', 'c-generador', val('generador'), 'Ubicación', false),
      ]) +
      grid([
        textareaCampo('Extinción automática', 'c-extincion-auto', val('extincion_auto'), 'Rociadores u otros', false),
        textareaCampo('Señalización existente', 'c-senaletica', val('senaletica'), 'Estado / cobertura', false),
      ]) +

      seccion('D. Instalaciones a representar en el plano') +
      '<div class="cq-checks">' +
        check('c-i-agua', 'Agua potable', ck('i_agua')) +
        check('c-i-alcant', 'Alcantarillado', ck('i_alcant')) +
        check('c-i-elec', 'Electricidad', ck('i_elec')) +
        check('c-i-gas', 'Gas', ck('i_gas')) +
        check('c-i-calef', 'Calefacción', ck('i_calef')) +
        check('c-i-artgas', 'Artefactos a gas', ck('i_artgas')) +
        check('c-i-vent', 'Ventilaciones', ck('i_vent')) +
      '</div>' +

      seccion('E. Personas del condominio') +
      '<p class="cq-note">Solo cantidades agregadas y necesidades de apoyo. No se registran datos médicos ni información personal sensible.</p>' +
      grid([
        campo('Residentes estimados', 'c-residentes', val('residentes'), 'text', ''),
        campo('Viviendas ocupadas', 'c-ocupadas', val('ocupadas'), 'text', ''),
      ]) +
      grid([
        campo('Personas con movilidad reducida', 'c-mov-reducida', val('mov_reducida'), 'text', 'Cantidad'),
        campo('Personas con discapacidad', 'c-discapacidad', val('discapacidad'), 'text', 'Cantidad'),
      ]) +
      grid([
        campo('Infantes', 'c-infantes', val('infantes'), 'text', 'Cantidad estimada'),
        campo('Adultos mayores que requieran apoyo', 'c-mayores', val('mayores'), 'text', 'Si se dispone'),
      ]) +
      grid([
        campo('Personas no hispanoparlantes', 'c-idioma', val('idioma'), 'text', 'Si aplica'),
        campo('Conserjería (dotación y turnos)', 'c-conserjeria', val('conserjeria'), 'text', 'Ej: 2 conserjes, 3 turnos'),
      ]) +

      seccion('F. Organización del condominio') +
      grid([
        campo('Administrador', 'c-admin', val('admin'), 'text', 'Nombre'),
        campo('Empresa administradora', 'c-empresa-admin', val('empresa_admin'), 'text', 'Ej: Admilagos'),
      ]) +
      grid([
        campo('Presidente del Comité de Administración', 'c-presidente', val('presidente'), 'text', 'Nombre'),
        campo('Coordinador de seguridad / emergencia', 'c-coordinador', val('coordinador'), 'text', 'Si existe'),
      ]) +
      textareaCampo('Líderes de evacuación por torre/piso', 'c-lideres', val('lideres'), 'Deja vacío si aún no se designan') +

      seccion('G. Servicios contratados a Plus Control') +
      '<p class="cq-note">Uso interno de gestión. No aparece como publicidad en el documento.</p>' +
      '<div class="cq-checks">' +
        check('c-s-plan', 'Plan de emergencia', ck('s_plan', true)) +
        check('c-s-actualizacion', 'Actualización anual', ck('s_actualizacion')) +
        check('c-s-simulacro', 'Simulacro / ejercicio', ck('s_simulacro')) +
        check('c-s-capacitacion', 'Capacitación', ck('s_capacitacion')) +
        check('c-s-mantencion', 'Mantención de extintores', ck('s_mantencion')) +
        check('c-s-senaletica', 'Señalética', ck('s_senaletica')) +
        check('c-s-inspeccion', 'Inspección de elementos de emergencia', ck('s_inspeccion')) +
      '</div>' +

      seccion('H. Organismos de emergencia de la comuna') +
      '<p class="cq-note">Si no los verificas ahora, el directorio los marcará como [COMPLETAR / VERIFICAR]. Nunca se inventan.</p>' +
      grid([
        campo('Bomberos (compañía)', 'c-bomberos', val('bomberos'), 'text', ''),
        campo('Dirección Bomberos', 'c-bomberos-dir', val('bomberos_dir'), 'text', ''),
      ]) +
      grid([
        campo('Carabineros (comisaría / retén)', 'c-carabineros', val('carabineros'), 'text', ''),
        campo('Dirección Carabineros', 'c-carabineros-dir', val('carabineros_dir'), 'text', ''),
      ]) +
      grid([
        campo('Centro asistencial / hospital', 'c-hospital', val('hospital'), 'text', ''),
        campo('Dirección del centro asistencial', 'c-hospital-dir', val('hospital_dir'), 'text', ''),
      ]) +

      '<div class="cq-actions">' +
        '<button class="cq-btn cq-btn-p" id="c-btn-guardar">' + (e ? 'Guardar cambios' : 'Guardar levantamiento') + '</button>' +
        '<button class="cq-btn" id="c-btn-cancelar">Cancelar</button>' +
      '</div></div>';

    document.getElementById('c-btn-cancelar').addEventListener('click', renderLista);
    document.getElementById('c-btn-guardar').addEventListener('click', function () { guardarCondo(editId); });
    var sa = document.getElementById('scroll-area'); if (sa) sa.scrollTop = 0;
  }

  // ── GUARDAR ────────────────────────────────────────────────────────────────
  function guardarCondo(editId) {
    for (var i = 0; i < REQ_CONDO.length; i++) {
      var el = document.getElementById(REQ_CONDO[i]);
      if (!el || !el.value.trim()) { alert('Completa los campos obligatorios (*): nombre, dirección, comuna y región.'); return; }
    }
    var previo = editId ? condos.find(function (x) { return x.id === editId; }) : null;
    var obj = {
      id: editId || Date.now(),
      nombre: v('c-nombre'), rut: v('c-rut'), direccion: v('c-dir'), comuna: v('c-comuna'),
      region: v('c-region'), rol: v('c-rol'), tipo: v('c-tipo'), situacion: v('c-situacion'),
      fecha_elab: v('c-fecha'), fecha_ant: v('c-fecha-ant'), costera: v('c-costera', 'No'),
      torres: v('c-torres'), torres_id: v('c-torres-id'), pisos: v('c-pisos'), unidades: v('c-unidades'),
      superficie: v('c-superficie'), estac: v('c-estac'), estac_sub: v('c-estac-sub'), estac_sup: v('c-estac-sup'),
      recintos: v('c-recintos'), areas: v('c-areas'),
      extintores: v('c-extintores'), red_humeda: v('c-red-humeda'), red_seca: v('c-red-seca'),
      grifos: v('c-grifos'), detectores: v('c-detectores'), alarma: v('c-alarma'), pulsadores: v('c-pulsadores'),
      ilum: v('c-ilum'), generador: v('c-generador'), extincion_auto: v('c-extincion-auto'), senaletica: v('c-senaletica'),
      i_agua: chk('c-i-agua'), i_alcant: chk('c-i-alcant'), i_elec: chk('c-i-elec'), i_gas: chk('c-i-gas'),
      i_calef: chk('c-i-calef'), i_artgas: chk('c-i-artgas'), i_vent: chk('c-i-vent'),
      residentes: v('c-residentes'), ocupadas: v('c-ocupadas'), mov_reducida: v('c-mov-reducida'),
      discapacidad: v('c-discapacidad'), infantes: v('c-infantes'), mayores: v('c-mayores'),
      idioma: v('c-idioma'), conserjeria: v('c-conserjeria'),
      admin: v('c-admin'), empresa_admin: v('c-empresa-admin'), presidente: v('c-presidente'),
      coordinador: v('c-coordinador'), lideres: v('c-lideres'),
      s_plan: chk('c-s-plan'), s_actualizacion: chk('c-s-actualizacion'), s_simulacro: chk('c-s-simulacro'),
      s_capacitacion: chk('c-s-capacitacion'), s_mantencion: chk('c-s-mantencion'),
      s_senaletica: chk('c-s-senaletica'), s_inspeccion: chk('c-s-inspeccion'),
      bomberos: v('c-bomberos'), bomberos_dir: v('c-bomberos-dir'),
      carabineros: v('c-carabineros'), carabineros_dir: v('c-carabineros-dir'),
      hospital: v('c-hospital'), hospital_dir: v('c-hospital-dir'),
    };
    // Preserva el plan ya generado al editar (bug corregido de v1).
    if (previo && previo.ultimo_plan) obj.ultimo_plan = previo.ultimo_plan;

    if (editId) {
      var idx = condos.findIndex(function (x) { return x.id === editId; });
      if (idx >= 0) condos[idx] = obj; else condos.push(obj);
    } else { condos.push(obj); }
    if (saveCondos()) { renderLista(); setTimeout(function () { alert('Levantamiento guardado.'); }, 120); }
  }

  // ── LISTA ──────────────────────────────────────────────────────────────────
  var CRITICOS = ['torres', 'pisos', 'unidades', 'extintores', 'residentes', 'presidente', 'admin', 'bomberos', 'carabineros', 'hospital'];
  function contarPendientes(c) { return CRITICOS.filter(function (k) { return !c[k] || !String(c[k]).trim(); }).length; }

  function renderLista() {
    var host = document.getElementById('pg-condos');
    if (!host) return;
    var filas = condos.length ? condos.map(function (c) {
      var p = contarPendientes(c);
      return '<div class="cq-card">' +
        '<div class="cq-card-title">' + esc(c.nombre) + '</div>' +
        '<div class="cq-card-sub">' + esc(c.comuna || '') +
          (c.unidades ? ' · ' + esc(c.unidades) + ' unidades' : '') +
          (c.torres ? ' · ' + esc(c.torres) + ' torres' : '') + '</div>' +
        (p > 0 ? '<div class="cq-warn">' + p + ' dato(s) crítico(s) pendiente(s)</div>'
               : '<div class="cq-ok">Levantamiento completo</div>') +
        (c.ultimo_plan ? '<div class="cq-ok">Plan generado el ' + new Date(c.ultimo_plan.fecha).toLocaleDateString('es-CL') + '</div>' : '') +
        '<div class="cq-card-btns">' +
          '<button class="cq-btn cq-btn-p cq-sm" data-act="gen" data-id="' + c.id + '">Generar plan</button>' +
          (c.ultimo_plan ? '<button class="cq-btn cq-sm" data-act="ver" data-id="' + c.id + '">Ver último</button>' : '') +
          '<button class="cq-btn cq-sm" data-act="edit" data-id="' + c.id + '">Editar</button>' +
          '<button class="cq-btn cq-sm cq-del" data-act="del" data-id="' + c.id + '">Eliminar</button>' +
        '</div></div>';
    }).join('') : '<div class="cq-empty">Aún no hay condominios registrados.<br>Crea el primer levantamiento para generar su Plan de Emergencia.</div>';

    host.innerHTML = '<div class="cq-wrap">' +
      '<div class="cq-head"><h2>Condominios</h2>' +
      '<p class="cq-sub">Planes de Emergencia y Evacuación — Ley 21.442, Art. 40.</p></div>' +
      '<div class="cq-actions">' +
        '<button class="cq-btn cq-btn-p" id="cq-nuevo">+ Nuevo condominio</button>' +
        (condos.length ? '<button class="cq-btn" id="cq-export">Exportar respaldo</button>' : '') +
      '</div>' + filas + '</div>';

    document.getElementById('cq-nuevo').addEventListener('click', function () { renderCuestionario(null); });
    var ex = document.getElementById('cq-export'); if (ex) ex.addEventListener('click', exportarJSON);
    Array.prototype.forEach.call(host.querySelectorAll('[data-act]'), function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id, 10), act = this.dataset.act;
        if (act === 'edit') renderCuestionario(id);
        else if (act === 'gen') generarPlan(id);
        else if (act === 'ver') {
          var c = condos.find(function (x) { return x.id === id; });
          if (c && c.ultimo_plan) finalizar(c, c.ultimo_plan.texto, validarDocumento(c.ultimo_plan.texto));
        } else if (act === 'del') {
          if (confirm('¿Eliminar este condominio y su levantamiento?')) {
            condos = condos.filter(function (x) { return x.id !== id; }); saveCondos(); renderLista();
          }
        }
      });
    });
    var sa = document.getElementById('scroll-area'); if (sa) sa.scrollTop = 0;
  }

  // ── SYSTEM PROMPT PROPIO (no hereda el de empresas) ────────────────────────
  var SYSTEM_CONDO =
'Eres el INGENIERO EN PREVENCIÓN DE RIESGOS SENIOR de Plus Control SpA, especialista en Planes de Emergencia y Evacuación para condominios en Chile.\n\n' +
'PRESTADOR: Plus Control SpA | RUT 77.916.708-9 | Lastarrias 602, Osorno, Región de Los Lagos. Certificación INCEN vigente en mantención de extintores.\n' +
'AUTOR TÉCNICO: Alan Bascur Montenegro | Ingeniero en Prevención de Riesgos | RUT 17.658.387-8.\n\n' +
'═══ MARCO LEGAL — EXACTITUD ABSOLUTA ═══\n' +
'USA ÚNICAMENTE:\n' +
'· Ley N°21.442 (Nueva Ley de Copropiedad Inmobiliaria), Artículo 40.\n' +
'· Reglamento de la Ley N°21.442 (Decreto MINVU, Diario Oficial 09-01-2025).\n' +
'· Norma técnica oficial del MINVU dictada conforme al artículo 4° transitorio de la Ley N°21.442. NO inventes su número ni su fecha: refiérete a ella exactamente con esa denominación.\n' +
'· Normas técnicas de apoyo solo cuando corresponda: NCh 934 (extintores portátiles), OGUC.\n' +
'ESTRICTAMENTE PROHIBIDO citar como fundamento del plan: Ley 19.537 (DEROGADA por la Ley 21.442), DS 44/2024, DS 40/1969, Ley 16.744, Ley Karin (21.643), Código del Trabajo. Son normas LABORALES de empresas y NO rigen una copropiedad. Si alguna aparece en plantillas previas de tu conocimiento, IGNÓRALA.\n\n' +
'═══ REGLAS ABSOLUTAS ═══\n' +
'1. No inventes NADA: ni nombres, ni teléfonos, ni cantidades, ni ubicaciones, ni instalaciones, ni referencias legales.\n' +
'2. Usa EXCLUSIVAMENTE los datos entregados del condominio, en todas las secciones.\n' +
'3. Si un dato viene como [PENDIENTE DE LEVANTAMIENTO], [NO INFORMADO], [NO PROPORCIONADO], [COMPLETAR / VERIFICAR] o [PENDIENTE DE DESIGNACIÓN], reprodúcelo como pendiente en el documento. NUNCA lo sustituyas por una suposición.\n' +
'4. El único marcador permitido en el cuerpo es el del plano: "[PLANO A CARGAR POR PLUS CONTROL]".\n' +
'5. Firmas conforme al Art. 40: (a) "Ingeniero en Prevención de Riesgos — Autor y responsable técnico": Alan Bascur Montenegro. (b) "Presidente del Comité de Administración — Suscripción". (c) "Administrador del Condominio — Suscripción". Si falta un nombre, deja la línea rotulada con el rol; NO inventes. NO uses la palabra "adoptantes".\n' +
'6. NO afirmes que el profesional se encuentra habilitado, registrado ni inscrito: esa condición se verifica por separado.\n' +
'7. El incendio debe ser el procedimiento más desarrollado. El uso de extintor es solo primera respuesta cuando las condiciones de seguridad lo permitan; NUNCA instruyas a residentes a enfrentar un incendio desarrollado.\n' +
'8. Distingue "actualización anual del plan" de "simulacros o ejercicios según los tipos de emergencia". NO afirmes que la ley exige literalmente un simulacro anual.\n' +
'9. NUNCA declares "aprobado por Bomberos/Carabineros" ni "garantiza la inscripción/aprobación". La fórmula correcta es: "Preparado para su presentación y mantención conforme al artículo 40 de la Ley N°21.442, sujeto a la revisión y actuaciones que correspondan a los organismos competentes."\n' +
'10. Español de Chile, formal, técnico, claro y ejecutable. Sin emojis, sin muletillas, sin lenguaje promocional, sin frases que revelen generación automática. Prefiere obligaciones operacionales concretas antes que "se recomienda".\n' +
'11. Encabezados de sección SIEMPRE con dos almohadillas y exactamente como se te indique (ej. "## CAPÍTULO 1 — INTRODUCCIÓN Y MARCO LEGAL"). Subsecciones con tres almohadillas.\n' +
'12. Para tablas usa markdown con barras verticales. No uses tablas para texto corrido.\n' +
'13. Genera SOLO la parte que se te solicita en cada llamada. No repitas portada ni secciones de otras partes. Sin preámbulos ni cierres del tipo "a continuación" o "espero que sirva".';

  // ── DATOS PARA EL PROMPT ───────────────────────────────────────────────────
  function buildDatosCondo(c) {
    function d(label, val2, pend) {
      var value = (val2 && String(val2).trim()) ? String(val2).trim() : (pend || '[PENDIENTE DE LEVANTAMIENTO]');
      return label + ': ' + value;
    }
    var servicios = [];
    [['s_plan', 'Plan de emergencia'], ['s_actualizacion', 'Actualización anual'], ['s_simulacro', 'Simulacro/ejercicio'],
     ['s_capacitacion', 'Capacitación'], ['s_mantencion', 'Mantención de extintores'], ['s_senaletica', 'Señalética'],
     ['s_inspeccion', 'Inspección de elementos de emergencia']]
      .forEach(function (p) { if (c[p[0]] === 'Sí') servicios.push(p[1]); });
    var instal = [];
    [['i_agua', 'agua potable'], ['i_alcant', 'alcantarillado'], ['i_elec', 'electricidad'], ['i_gas', 'gas'],
     ['i_calef', 'calefacción'], ['i_artgas', 'artefactos a gas'], ['i_vent', 'ventilaciones']]
      .forEach(function (p) { if (c[p[0]] === 'Sí') instal.push(p[1]); });

    return [
      '═══ DATOS DEL CONDOMINIO ═══',
      d('NOMBRE', c.nombre), d('RUT COMUNIDAD', c.rut, '[NO PROPORCIONADO]'),
      d('DIRECCIÓN', c.direccion), d('COMUNA', c.comuna), d('REGIÓN', c.region),
      d('ROL DE AVALÚO', c.rol, '[NO PROPORCIONADO]'),
      d('TIPO', c.tipo, 'No especificado'),
      'SITUACIÓN: ' + (c.situacion === 'primer_plan' ? 'Primer plan (condominio nuevo)' : 'Actualización (condominio existente)'),
      d('FECHA DE ELABORACIÓN', c.fecha_elab, new Date().toLocaleDateString('es-CL')),
      d('ACTUALIZACIÓN ANTERIOR', c.fecha_ant, '[NO APLICA / PRIMERA VERSIÓN]'),
      'COMUNA COSTERA: ' + (c.costera === 'Sí' ? 'SÍ — desarrolla el procedimiento de tsunami' : 'NO — incluye la frase de exclusión de tsunami'),
      '',
      '─ CONFIGURACIÓN FÍSICA ─',
      d('TORRES/BLOCKS', c.torres), d('IDENTIFICACIÓN TORRES', c.torres_id, 'No especificado'),
      d('PISOS POR TORRE', c.pisos), d('TOTAL UNIDADES', c.unidades),
      d('SUPERFICIE', c.superficie, '[NO PROPORCIONADO]'),
      d('ESTACIONAMIENTOS', c.estac, '[NO PROPORCIONADO]'),
      d('  subterráneos', c.estac_sub, 'No especificado'), d('  superficie', c.estac_sup, 'No especificado'),
      d('RECINTOS CRÍTICOS', c.recintos), d('ÁREAS COMUNES', c.areas, 'No especificado'),
      '',
      '─ SISTEMAS DE EMERGENCIA ─',
      d('EXTINTORES', c.extintores), d('RED HÚMEDA', c.red_humeda, '[NO INFORMADO]'),
      d('RED SECA', c.red_seca, '[NO INFORMADO]'), d('GRIFOS/BOCAS', c.grifos, '[NO INFORMADO]'),
      d('DETECTORES DE HUMO', c.detectores, '[NO INFORMADO]'), d('ALARMA', c.alarma, '[NO INFORMADO]'),
      d('PULSADORES', c.pulsadores, '[NO INFORMADO]'), d('ILUMINACIÓN EMERGENCIA', c.ilum, '[NO INFORMADO]'),
      d('GRUPO ELECTRÓGENO', c.generador, '[NO INFORMADO]'), d('EXTINCIÓN AUTOMÁTICA', c.extincion_auto, '[NO INFORMADO]'),
      d('SEÑALIZACIÓN', c.senaletica, '[NO INFORMADO]'),
      'INSTALACIONES PARA EL PLANO: ' + (instal.length ? instal.join(', ') : '[PENDIENTE DE LEVANTAMIENTO]'),
      '',
      '─ PERSONAS ─',
      d('RESIDENTES ESTIMADOS', c.residentes), d('VIVIENDAS OCUPADAS', c.ocupadas, 'No especificado'),
      d('MOVILIDAD REDUCIDA', c.mov_reducida, 'No informado'), d('DISCAPACIDAD', c.discapacidad, 'No informado'),
      d('INFANTES', c.infantes, 'No informado'), d('ADULTOS MAYORES CON APOYO', c.mayores, 'No informado'),
      d('NO HISPANOPARLANTES', c.idioma, 'No informado'), d('CONSERJERÍA', c.conserjeria, 'No especificado'),
      '',
      '─ ORGANIZACIÓN ─',
      d('ADMINISTRADOR', c.admin), d('EMPRESA ADMINISTRADORA', c.empresa_admin, 'No especificado'),
      d('PRESIDENTE COMITÉ', c.presidente),
      d('COORDINADOR SEGURIDAD', c.coordinador, '[PENDIENTE DE DESIGNACIÓN]'),
      d('LÍDERES DE EVACUACIÓN', c.lideres, '[PENDIENTE DE DESIGNACIÓN]'),
      '',
      '─ ORGANISMOS DE LA COMUNA ─',
      d('BOMBEROS', c.bomberos, '[COMPLETAR / VERIFICAR]') + (c.bomberos_dir ? ' | ' + c.bomberos_dir : ''),
      d('CARABINEROS', c.carabineros, '[COMPLETAR / VERIFICAR]') + (c.carabineros_dir ? ' | ' + c.carabineros_dir : ''),
      d('CENTRO ASISTENCIAL', c.hospital, '[COMPLETAR / VERIFICAR]') + (c.hospital_dir ? ' | ' + c.hospital_dir : ''),
      '',
      'SERVICIOS CONTRATADOS (uso interno, NO mencionar en el documento): ' + (servicios.length ? servicios.join(', ') : 'No especificado'),
      '═══════════════════════════',
    ].join('\n');
  }

  // ── PARTES (evita el corte por max_tokens 8192) ────────────────────────────
  var PARTES = [
    { label: 'Capítulos 1 a 4', instr:
      'Genera SOLO estas secciones:\n' +
      '## CAPÍTULO 1 — INTRODUCCIÓN Y MARCO LEGAL (finalidad del plan; identificación del condominio con sus datos reales; obligación del Artículo 40 de la Ley N°21.442; Reglamento de la ley publicado el 09-01-2025; referencia a la norma técnica oficial del MINVU del artículo 4° transitorio; responsables de suscripción).\n' +
      '## CAPÍTULO 2 — OBJETIVOS Y ALCANCE (objetivo general, objetivos específicos, alcance territorial y de personas).\n' +
      '## CAPÍTULO 3 — DEFINICIONES (emergencia, evacuación, evacuación parcial, evacuación total, vía de evacuación, zona de seguridad, punto de encuentro, alerta, alarma, amenaza, vulnerabilidad, emergencia controlada).\n' +
      '## CAPÍTULO 4 — DESCRIPCIÓN DEL CONDOMINIO (configuración física, unidades, población, recintos críticos y sistemas de emergencia existentes; usa una tabla markdown para el resumen de sistemas). Solo datos reales; lo pendiente se declara pendiente.' },
    { label: 'Pasos I y II', instr:
      'Genera SOLO estas secciones:\n' +
      '## PASO I — ORGANIZACIÓN ANTE UNA EMERGENCIA (comité de administración, administrador, coordinador de emergencia/seguridad, conserjería, líderes de evacuación por torre y piso, personal de apoyo; responsabilidades detalladas de cada rol). Si un cargo no está designado, describe la función y deja el responsable como pendiente de designación.\n' +
      '## PASO II — PLAN GENERAL DE EMERGENCIA Y EVACUACIÓN (detección; formas de dar la alerta; alarma; comunicación interna; evaluación; criterios de decisión de evacuación; evacuación parcial; evacuación total; vías de evacuación; zonas de seguridad; puntos de encuentro; control de acceso durante la emergencia; coordinación con organismos externos; condiciones para el retorno).' },
    { label: 'Incendio', instr:
      'Genera SOLO esta sección, muy desarrollada:\n' +
      '## PASO III — PROCEDIMIENTOS POR EMERGENCIA ESPECÍFICA\n' +
      '### 3.1 INCENDIO (detección; alerta temprana; aviso a conserjería; activación de alarma; llamado a Bomberos 132; evaluación inicial; decisión de evacuación; cierre de puertas cuando sea seguro; prohibición de ascensores cuando corresponda; desplazamiento por vías señalizadas; llegada a zona de seguridad; recuento de personas; apoyo a personas con movilidad reducida; coordinación con Bomberos a su llegada; condiciones de retorno). Estructura en ANTES, DURANTE y DESPUÉS. Incluye el uso de extintor SOLO como primera respuesta cuando las condiciones de seguridad lo permitan, conforme NCh 934, con la secuencia de operación. NO instruyas a residentes a enfrentar un incendio desarrollado.\n' +
      'No generes las demás subsecciones: se generan aparte.' },
    { label: 'Sismo, gas, inundación', instr:
      'Genera SOLO estas subsecciones (continúan el PASO III ya generado; NO repitas su encabezado principal):\n' +
      '### 3.2 SISMO O TERREMOTO (antes, durante, después).\n' +
      '### 3.3 TSUNAMI — desarrolla el procedimiento únicamente si la comuna es costera según los datos entregados; si NO lo es, escribe solo el título y la frase: "El riesgo de tsunami no se incorpora como escenario operativo para este condominio debido a su ubicación territorial."\n' +
      '### 3.4 FUGA O ESCAPE DE GAS (antes, durante, después).\n' +
      '### 3.5 INUNDACIÓN (antes, durante, después).\n' +
      '### 3.6 OTRAS EMERGENCIAS IDENTIFICADAS.\n' +
      'Cada procedimiento con alerta, comunicación, evacuación, responsabilidades, coordinación externa y retorno.' },
    { label: 'Evacuación asistida, Paso IV y organismos', instr:
      'Genera SOLO estas secciones:\n' +
      '## PASO III-B — EVACUACIÓN DE PERSONAS QUE REQUIEREN ASISTENCIA (identificación preventiva de necesidades de apoyo; asignación de acompañantes; comunicación; rutas accesibles cuando existan; alternativas cuando una ruta no sea utilizable; prioridad de evacuación según la emergencia; prohibición expresa de maniobras inseguras). No inventes nombres de responsables.\n' +
      '## PASO IV — IMPLEMENTACIÓN DEL PLAN (responsabilidades; capacitación de residentes; comunicación y difusión; inducción a trabajadores del condominio; inspección de instalaciones; mantención de equipos de emergencia; simulacros o ejercicios según los tipos de emergencia; evaluación posterior; actualización anual del plan).\n' +
      '## COORDINACIÓN CON ORGANISMOS EXTERNOS (procedimiento de entrega del plan en formato material y digital a Bomberos y Carabineros de la comuna; registro de fecha, organismo y receptor; espacio para constancia de recepción; incluye la fórmula: "Preparado para su presentación y mantención conforme al artículo 40 de la Ley N°21.442, sujeto a la revisión y actuaciones que correspondan a los organismos competentes.").' },
    { label: 'Anexos 1 a 7', instr:
      'Genera SOLO los anexos, usando tablas markdown con barras verticales:\n' +
      '## ANEXO 1 — ORGANIZACIÓN Y ENCARGADOS (tabla: Cargo/Rol | Nombre | Contacto | Función. Usa los nombres reales entregados; los que falten van como "[POR DESIGNAR]". NO inventes).\n' +
      '## ANEXO 2 — PLANOS DE EMERGENCIA Y EVACUACIÓN (escribe exactamente "[PLANO A CARGAR POR PLUS CONTROL]" y a continuación: "El plano deberá representar las vías de evacuación, escaleras, salidas, zonas de seguridad, puntos de encuentro, extintores, red húmeda, red seca, grifos o bocas de incendio, grupo electrógeno, iluminación de emergencia, detectores, alarmas, pulsadores, sistemas de extinción, y las instalaciones de agua potable, alcantarillado, electricidad, gas, calefacción, artefactos a gas y ventilaciones asociadas que existan en el condominio." NO inventes ubicaciones).\n' +
      '## ANEXO 3 — DIRECTORIO DE EMERGENCIA (tabla Organismo | Teléfono | Dirección. Nacionales: Bomberos 132, Carabineros 133, SAMU 131. Los datos locales no entregados van como [COMPLETAR / VERIFICAR]. NO inventes números).\n' +
      '## ANEXO 4 — REGISTRO DE MANTENCIÓN E INSPECCIÓN DE EXTINTORES (tabla: N° | Ubicación | Tipo | Capacidad | Fecha mantención | Próxima mantención | Estado | Observaciones. Si no hay inventario entregado, una fila con "[LEVANTAMIENTO PENDIENTE]" y filas en blanco para completar en terreno).\n' +
      '## ANEXO 5 — REGISTRO DE CAPACITACIÓN (tabla: Fecha | Tema | Relator | N° participantes | Observaciones | Firma).\n' +
      '## ANEXO 6 — REGISTRO DE SIMULACRO O EJERCICIO (tabla: Fecha | Tipo de emergencia | Modalidad | Participantes | Tiempo de evacuación | Dificultades | Acciones correctivas | Responsable | Seguimiento).\n' +
      '## ANEXO 7 — REGISTRO DE ACTUALIZACIÓN DEL PLAN (tabla: Fecha | Motivo | Cambios realizados | Responsable | Firma).' },
  ];

  // ── LLAMADA AL SERVIDOR ────────────────────────────────────────────────────
  function callAPI(prompt, onChunk, intentos) {
    intentos = intentos || 0;
    return new Promise(function (resolve, reject) {
      var full = '', ctrl = new AbortController();
      var tmt = setTimeout(function () { ctrl.abort(); }, 290000);

      function reintentar(motivo, espera) {
        if (intentos < 3) {
          setTimeout(function () {
            callAPI(prompt, onChunk, intentos + 1).then(resolve).catch(reject);
          }, espera);
        } else {
          reject(new Error(motivo + ' (tras 4 intentos). Espere un minuto y reintente.'));
        }
      }

      fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, system: SYSTEM_CONDO }), signal: ctrl.signal,
      }).then(function (res) {
        if (!res.ok) { clearTimeout(tmt); reintentar('Servidor no disponible (' + res.status + ')', 6000); return; }
        var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
        (function leer() {
          reader.read().then(function (r) {
            if (r.done) {
              clearTimeout(tmt);
              if (full) resolve(full);
              // Flujo cerrado sin contenido: casi siempre es saturación o
              // límite de velocidad. Se reintenta con espera creciente.
              else reintentar('Respuesta vacía', 10000 + intentos * 8000);
              return;
            }
            buf += dec.decode(r.value, { stream: true });
            var lines = buf.split('\n'); buf = lines.pop();
            for (var i = 0; i < lines.length; i++) {
              if (lines[i].indexOf('data: ') !== 0) continue;
              try {
                var o = JSON.parse(lines[i].slice(6));
                if (o.chunk) { full += o.chunk; if (onChunk) onChunk(o.chunk); }
                if (o.error) {
                  clearTimeout(tmt);
                  var esTemporal = /RATE_LIMIT|OVERLOADED|429|529|overload/i.test(o.error);
                  if (esTemporal && !full) reintentar(o.error, 15000 + intentos * 10000);
                  else reject(new Error(o.error));
                  return;
                }
              } catch (e) {}
            }
            leer();
          }).catch(function (e) { clearTimeout(tmt); reject(e); });
        })();
      }).catch(function (e) { clearTimeout(tmt); reject(e); });
    });
  }

  // ── GENERACIÓN POR PARTES ──────────────────────────────────────────────────
  function generarPlan(id) {
    var c = condos.find(function (x) { return x.id === id; });
    if (!c) return;
    var pend = contarPendientes(c);
    if (pend > 0 && !confirm('Este condominio tiene ' + pend + ' dato(s) crítico(s) pendiente(s).\n\n' +
      'El plan los marcará como PENDIENTE (no se inventarán). ¿Continuar?')) return;

    var host = document.getElementById('pg-condos');
    host.innerHTML = '<div class="cq-wrap"><div class="cq-gen">' +
      '<h2>Generando Plan de Emergencia</h2>' +
      '<p class="cq-sub">' + esc(c.nombre) + '</p>' +
      '<p class="cq-step" id="cq-step">Preparando…</p>' +
      '<div class="cq-progress"><div class="cq-bar" id="cq-bar"></div></div>' +
      '<pre class="cq-stream" id="cq-stream"></pre>' +
      '<p class="cq-note">Son ' + PARTES.length + ' partes con pausas entre cada una. Puede tardar varios minutos. No cierres la aplicación durante el proceso.</p>' +
      '</div></div>';

    var datos = buildDatosCondo(c);
    var stream = document.getElementById('cq-stream');
    var bar = document.getElementById('cq-bar');
    var step = document.getElementById('cq-step');
    var acumulado = [];

    function hacerParte(i) {
      if (i >= PARTES.length) {
        var texto = acumulado.join('\n\n');
        c.ultimo_plan = { fecha: Date.now(), texto: texto };
        saveCondos();
        finalizar(c, texto, validarDocumento(texto));
        return;
      }
      var p = PARTES[i];
      step.textContent = 'Parte ' + (i + 1) + ' de ' + PARTES.length + ' — ' + p.label;
      bar.style.width = ((i / PARTES.length) * 100) + '%';
      var parcial = '';
      callAPI(datos + '\n\n' + p.instr, function (ch) {
        parcial += ch;
        stream.textContent = parcial.slice(-2500);
        stream.scrollTop = stream.scrollHeight;
      }).then(function (t) {
        acumulado.push(t.trim());
        // Pausa entre partes: evita gatillar el límite de velocidad de la API.
        step.textContent = 'Parte ' + (i + 1) + ' completada. Preparando la siguiente…';
        setTimeout(function () { hacerParte(i + 1); }, 4000);
      }).catch(function (err) {
        host.innerHTML = '<div class="cq-wrap"><div class="cq-error">' +
          '<h2>Error al generar</h2>' +
          '<p>Parte ' + (i + 1) + ' (' + esc(p.label) + '): ' + esc(err.message || String(err)) + '</p>' +
          '<p class="cq-sub">Las ' + i + ' parte(s) ya generadas no se perdieron. Puedes continuar desde donde quedó.</p>' +
          '<div class="cq-actions" style="justify-content:center">' +
          '<button class="cq-btn cq-btn-p" id="cq-seguir">Reintentar esta parte</button>' +
          '<button class="cq-btn" id="cq-volver">Volver</button></div></div></div>';
        document.getElementById('cq-volver').addEventListener('click', renderLista);
        document.getElementById('cq-seguir').addEventListener('click', function () {
          host.innerHTML = '<div class="cq-wrap"><div class="cq-gen">' +
            '<h2>Generando Plan de Emergencia</h2>' +
            '<p class="cq-sub">' + esc(c.nombre) + '</p>' +
            '<p class="cq-step" id="cq-step">Reanudando…</p>' +
            '<div class="cq-progress"><div class="cq-bar" id="cq-bar"></div></div>' +
            '<pre class="cq-stream" id="cq-stream"></pre></div></div>';
          stream = document.getElementById('cq-stream');
          bar = document.getElementById('cq-bar');
          step = document.getElementById('cq-step');
          hacerParte(i);
        });
      });
    }
    hacerParte(0);
  }

  // ── VALIDADOR MECÁNICO (tolerante a tildes) ────────────────────────────────
  function norm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }

  function validarDocumento(texto) {
    var errores = [], t = texto || '', T = norm(t);
    // Legal
    if (/19\.?537/.test(t)) errores.push('LEGAL: aparece la Ley 19.537 (derogada).');
    if (/DS\s*44[\/\-]?\s*2024|DECRETO SUPREMO\s*44/i.test(t)) errores.push('LEGAL: aparece DS 44/2024 (normativa laboral).');
    if (/LEY KARIN|21\.?643/i.test(t)) errores.push('LEGAL: aparece Ley Karin (no aplica a condominios).');
    if (/C[ÓO]DIGO DEL TRABAJO/i.test(t)) errores.push('LEGAL: aparece el Código del Trabajo.');
    if (/16\.?744/.test(t)) errores.push('LEGAL: aparece Ley 16.744 (normativa laboral).');
    if (!/21\.?442/.test(t)) errores.push('LEGAL: no se menciona la Ley 21.442.');
    if (!/ART[IÍ]CULO\s*40|ART\.?\s*40/i.test(t)) errores.push('LEGAL: no se menciona el Artículo 40.');
    if (!/REGLAMENTO/i.test(t)) errores.push('LEGAL: no se menciona el Reglamento de la Ley 21.442.');
    // Estructura
    ['CAPITULO 1', 'CAPITULO 2', 'CAPITULO 3', 'CAPITULO 4', 'PASO I', 'PASO II', 'PASO III', 'PASO IV']
      .forEach(function (s) { if (T.indexOf(s) === -1) errores.push('ESTRUCTURA: falta ' + s + '.'); });
    for (var a = 1; a <= 7; a++) if (T.indexOf('ANEXO ' + a) === -1) errores.push('ESTRUCTURA: falta el ANEXO ' + a + '.');
    if (t.indexOf('[PLANO A CARGAR POR PLUS CONTROL]') === -1) errores.push('ESTRUCTURA: falta el marcador del plano.');
    // Firmas
    if (T.indexOf('BASCUR') === -1) errores.push('FIRMAS: falta el autor técnico.');
    if (T.indexOf('PRESIDENTE DEL COMITE') === -1) errores.push('FIRMAS: falta el Presidente del Comité.');
    if (T.indexOf('ADMINISTRADOR DEL CONDOMINIO') === -1) errores.push('FIRMAS: falta el Administrador.');
    if (/ADOPTANTE/i.test(t)) errores.push('FIRMAS: se usa el término "adoptantes" (prohibido).');
    // Emergencias
    if (T.indexOf('INCENDIO') === -1) errores.push('EMERGENCIAS: falta incendio.');
    if (T.indexOf('SISMO') === -1 && T.indexOf('TERREMOTO') === -1) errores.push('EMERGENCIAS: falta sismo.');
    if (T.indexOf('GAS') === -1) errores.push('EMERGENCIAS: falta fuga de gas.');
    if (T.indexOf('INUNDACION') === -1) errores.push('EMERGENCIAS: falta inundación.');
    if (T.indexOf('ASISTENCIA') === -1 && T.indexOf('ASISTIDA') === -1) errores.push('EMERGENCIAS: falta evacuación asistida.');
    // Promesas prohibidas
    if (/APROBADO POR BOMBEROS|APROBADO POR CARABINEROS|GARANTIZA (LA )?(INSCRIPCI[ÓO]N|APROBACI[ÓO]N)/i.test(t))
      errores.push('RIESGO: el documento promete aprobación de terceros.');
    // Truncamiento
    if (t.length < 6000) errores.push('EXTENSIÓN: el documento parece incompleto o truncado.');
    return errores;
  }

  // ── RESULTADO ──────────────────────────────────────────────────────────────
  function finalizar(c, texto, errores) {
    var host = document.getElementById('pg-condos');
    host.innerHTML = '<div class="cq-wrap">' +
      '<div class="cq-head"><h2>Plan generado</h2><p class="cq-sub">' + esc(c.nombre) + '</p></div>' +
      (errores.length
        ? '<div class="cq-val cq-val-fail"><strong>Control de calidad: ' + errores.length + ' observación(es)</strong><ul>' +
          errores.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
          '</ul><p>Corrige antes de entregar al cliente. Puedes regenerar desde la lista.</p></div>'
        : '<div class="cq-val cq-val-ok"><strong>Control mecánico: sin observaciones.</strong> La coherencia de los datos reales debe verificarla Alan leyendo el documento.</div>') +
      '<div class="cq-actions">' +
        '<button class="cq-btn cq-btn-p" id="cq-print">Descargar PDF</button>' +
        '<button class="cq-btn" id="cq-copy">Copiar texto</button>' +
        '<button class="cq-btn" id="cq-volver">Volver</button>' +
      '</div><pre class="cq-doc" id="cq-doc"></pre></div>';
    document.getElementById('cq-doc').textContent = texto;
    document.getElementById('cq-volver').addEventListener('click', renderLista);
    document.getElementById('cq-copy').addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(texto).then(function () { alert('Texto copiado.'); });
      else alert('Copia manual desde el cuadro de texto.');
    });
    document.getElementById('cq-print').addEventListener('click', function () { imprimirPlan(c, texto); });
    var sa = document.getElementById('scroll-area'); if (sa) sa.scrollTop = 0;
  }

  // ── MARKDOWN → HTML (con tablas reales) ────────────────────────────────────
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function mdToHtml(texto) {
    var lineas = texto.split('\n'), out = [], i = 0, indice = [];
    function esFila(l) { return /^\s*\|.*\|\s*$/.test(l); }
    while (i < lineas.length) {
      var l = lineas[i];
      if (esFila(l)) {
        var filas = [];
        while (i < lineas.length && esFila(lineas[i])) { filas.push(lineas[i]); i++; }
        var cells = filas.map(function (f) {
          return f.trim().replace(/^\||\|$/g, '').split('|').map(function (x) { return x.trim(); });
        }).filter(function (r) {
          return !r.every(function (x) { return /^:?-{2,}:?$/.test(x) || x === ''; });
        });
        if (cells.length) {
          var head = cells.shift();
          out.push('<table><thead><tr>' + head.map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + cells.map(function (r) {
              return '<tr>' + r.map(function (x) { return '<td>' + inline(x) + '</td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table>');
        }
        continue;
      }
      var h3 = l.match(/^###\s+(.*)/), h2 = l.match(/^##\s+(.*)/);
      if (h3) { out.push('<h3>' + inline(h3[1].trim()) + '</h3>'); i++; continue; }
      if (h2) { var t2 = h2[1].trim(); indice.push(t2); out.push('<h2>' + inline(t2) + '</h2>'); i++; continue; }
      if (/^\s*[-*•]\s+/.test(l)) {
        var items = [];
        while (i < lineas.length && /^\s*[-*•]\s+/.test(lineas[i])) { items.push(lineas[i].replace(/^\s*[-*•]\s+/, '')); i++; }
        out.push('<ul>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>');
        continue;
      }
      if (!l.trim()) { i++; continue; }
      out.push('<p>' + inline(l) + '</p>'); i++;
    }
    return { html: out.join('\n'), indice: indice };
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  function imprimirPlan(c, texto) {
    var fecha = c.fecha_elab
      ? new Date(c.fecha_elab + 'T00:00:00').toLocaleDateString('es-CL')
      : new Date().toLocaleDateString('es-CL');
    var conv = mdToHtml(texto);
    var idx = conv.indice.length >= 3
      ? '<h2>ÍNDICE</h2><ol class="idx">' + conv.indice.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="pb"></div>'
      : '';
    function fbox(nombre, rol, extra) {
      return '<div class="fbox"><div class="fl"></div><div class="fn">' + (nombre ? esc(nombre) : '&nbsp;') + '</div>' +
        '<div class="fr">' + esc(rol) + '</div>' + (extra ? '<div class="fx">' + esc(extra) + '</div>' : '') + '</div>';
    }
    var firmas = '<div class="pb"></div><h2>SUSCRIPCIÓN DEL PLAN</h2>' +
      '<p>Conforme al artículo 40 de la Ley N°21.442, el presente plan es suscrito por:</p>' +
      fbox('Alan Bascur Montenegro', 'Ingeniero en Prevención de Riesgos — Autor y responsable técnico', 'RUT 17.658.387-8 · Plus Control SpA') +
      fbox(c.presidente || '', 'Presidente del Comité de Administración — Suscripción', c.nombre || '') +
      fbox(c.admin || '', 'Administrador del Condominio — Suscripción', c.empresa_admin || '') +
      '<p class="legal">Preparado para su presentación y mantención conforme al artículo 40 de la Ley N°21.442, sujeto a la revisión y actuaciones que correspondan a los organismos competentes.</p>';

    var html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
      '<title>Plan de Emergencia — ' + esc(c.nombre) + '</title><style>' +
      '@page{size:A4;margin:2.2cm 2cm;}' +
      'body{font-family:Georgia,"Times New Roman",serif;color:#1a1a1a;line-height:1.55;font-size:11pt;margin:0;}' +
      '.portada{text-align:center;padding-top:7cm;}' +
      '.portada h1{font-size:24pt;margin:0 0 .4cm;letter-spacing:.5px;}' +
      '.portada .n{font-size:15pt;font-weight:bold;margin-bottom:.2cm;}' +
      '.portada .d{font-size:11pt;color:#444;}' +
      '.portada .m{margin-top:3.5cm;font-size:10.5pt;color:#444;line-height:1.9;}' +
      'h2{font-size:13.5pt;color:#7a1f1f;border-bottom:2px solid #7a1f1f;padding-bottom:4px;margin:26px 0 12px;page-break-after:avoid;}' +
      'h3{font-size:12pt;color:#333;margin:18px 0 8px;page-break-after:avoid;}' +
      'p{margin:6px 0;text-align:justify;}' +
      'ul{margin:6px 0 6px 18px;} li{margin:3px 0;}' +
      'ol.idx{font-size:10.5pt;} ol.idx li{margin:4px 0;}' +
      'table{width:100%;border-collapse:collapse;margin:10px 0;font-size:9pt;page-break-inside:avoid;}' +
      'th{background:#f0ecec;border:1px solid #999;padding:5px 6px;text-align:left;font-size:8.5pt;}' +
      'td{border:1px solid #bbb;padding:5px 6px;vertical-align:top;height:18px;}' +
      '.pb{page-break-after:always;}' +
      '.fbox{margin-top:1.5cm;page-break-inside:avoid;}' +
      '.fl{border-top:1px solid #333;width:8cm;margin-bottom:5px;}' +
      '.fn{font-weight:bold;font-size:10.5pt;} .fr{font-size:10pt;} .fx{font-size:9.5pt;color:#555;}' +
      '.legal{margin-top:1.5cm;font-size:9pt;color:#555;font-style:italic;border-top:1px solid #ccc;padding-top:8px;}' +
      '</style></head><body>' +
      '<div class="portada"><h1>PLAN DE EMERGENCIA<br>Y EVACUACIÓN</h1>' +
      '<div class="n">' + esc(c.nombre) + '</div>' +
      '<div class="d">' + esc(c.direccion || '') + (c.comuna ? ', ' + esc(c.comuna) : '') +
      (c.region ? ', Región de ' + esc(c.region) : '') + '</div>' +
      '<div class="m">Elaborado conforme al artículo 40 de la Ley N°21.442<br>sobre Copropiedad Inmobiliaria<br><br>' +
      'Plus Control SpA — RUT 77.916.708-9<br>Alan Bascur Montenegro, Ingeniero en Prevención de Riesgos<br><br>' +
      esc(fecha) + '</div></div><div class="pb"></div>' +
      idx + conv.html + firmas + '</body></html>';

    var w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana. Permite ventanas emergentes e intenta nuevamente.'); return; }
    w.document.write(html); w.document.close();
    setTimeout(function () { try { w.print(); } catch (e) {} }, 500);
  }

  // ── ESTILOS (tema oscuro alineado a la app) ────────────────────────────────
  function inyectarEstilos() {
    if (document.getElementById('pc-condo-styles')) return;
    var s = document.createElement('style');
    s.id = 'pc-condo-styles';
    s.textContent =
      '.cq-wrap{max-width:820px;margin:0 auto;}' +
      '.cq-head h2{margin:0 0 4px;font-size:20px;color:var(--paper,#e8e6de);}' +
      '.cq-sub{color:var(--muted,#666672);font-size:12.5px;margin:0 0 14px;line-height:1.5;}' +
      '.cq-sec{background:var(--bg4,#222229);color:var(--v3,#6ec462);padding:9px 12px;border-radius:8px;' +
        'font-weight:700;margin:22px 0 12px;font-size:13px;border-left:3px solid var(--v,#3d7a35);}' +
      '.cq-note{color:var(--muted,#666672);font-size:11.5px;margin:-4px 0 10px;font-style:italic;line-height:1.5;}' +
      '.cq-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}' +
      '@media(max-width:600px){.cq-grid{grid-template-columns:1fr;}}' +
      '.cq-field{display:flex;flex-direction:column;margin-bottom:10px;}' +
      '.cq-field.cq-full{grid-column:1/-1;}' +
      '.cq-field label{font-size:11.5px;font-weight:600;color:var(--paper2,#c8c6be);margin-bottom:5px;}' +
      '.cq-field input,.cq-field select,.cq-field textarea{padding:9px 11px;border:1px solid var(--line,rgba(255,255,255,.07));' +
        'border-radius:8px;font-size:13px;font-family:inherit;background:var(--bg3,#18181d);color:var(--paper,#e8e6de);}' +
      '.cq-field input:focus,.cq-field select:focus,.cq-field textarea:focus{outline:none;border-color:var(--v2,#52a347);}' +
      '.cq-field textarea{resize:vertical;}' +
      '.cq-checks{display:flex;flex-wrap:wrap;gap:9px 16px;margin-bottom:14px;}' +
      '.cq-check{font-size:12.5px;display:flex;align-items:center;gap:6px;color:var(--paper2,#c8c6be);}' +
      '.cq-actions{display:flex;gap:8px;margin:20px 0;flex-wrap:wrap;}' +
      '.cq-btn{padding:10px 16px;border-radius:9px;border:1px solid var(--line,rgba(255,255,255,.07));' +
        'background:var(--bg3,#18181d);color:var(--paper,#e8e6de);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.cq-btn:active{transform:scale(.97);}' +
      '.cq-btn-p{background:var(--v,#3d7a35);border-color:var(--v,#3d7a35);color:#fff;}' +
      '.cq-sm{padding:7px 11px;font-size:12px;}' +
      '.cq-del{color:var(--rojo2,#e06060);}' +
      '.cq-card{border:1px solid var(--line,rgba(255,255,255,.07));border-radius:12px;padding:14px;' +
        'margin-bottom:10px;background:var(--bg2,#111114);}' +
      '.cq-card-title{font-weight:700;font-size:14.5px;color:var(--paper,#e8e6de);}' +
      '.cq-card-sub{color:var(--muted,#666672);font-size:12px;margin-top:3px;}' +
      '.cq-warn{color:var(--oro2,#d4ae58);font-size:11.5px;margin-top:6px;}' +
      '.cq-ok{color:var(--v3,#6ec462);font-size:11.5px;margin-top:6px;}' +
      '.cq-card-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px;}' +
      '.cq-empty{text-align:center;color:var(--muted,#666672);padding:36px 20px;font-size:13px;' +
        'border:1px dashed var(--line,rgba(255,255,255,.07));border-radius:12px;line-height:1.7;}' +
      '.cq-gen{text-align:center;padding:14px 0;}' +
      '.cq-step{color:var(--v3,#6ec462);font-size:13px;font-weight:600;margin:12px 0;}' +
      '.cq-progress{height:7px;background:var(--bg4,#222229);border-radius:4px;overflow:hidden;margin:12px 0;}' +
      '.cq-bar{height:100%;width:0;background:var(--v2,#52a347);transition:width .4s;}' +
      '.cq-stream{text-align:left;background:var(--bg,#0a0a0c);border:1px solid var(--line,rgba(255,255,255,.07));' +
        'border-radius:8px;padding:11px;max-height:230px;overflow:auto;font-size:10.5px;white-space:pre-wrap;' +
        'color:var(--muted,#666672);line-height:1.5;}' +
      '.cq-val{padding:12px 14px;border-radius:10px;margin:12px 0;font-size:12.5px;line-height:1.6;}' +
      '.cq-val-ok{background:rgba(110,196,98,.1);border:1px solid rgba(110,196,98,.3);color:var(--v3,#6ec462);}' +
      '.cq-val-fail{background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.3);color:var(--rojo2,#e06060);}' +
      '.cq-val ul{margin:8px 0 8px 18px;} .cq-val li{margin:4px 0;}' +
      '.cq-doc{text-align:left;background:var(--bg2,#111114);border:1px solid var(--line,rgba(255,255,255,.07));' +
        'border-radius:10px;padding:14px;max-height:460px;overflow:auto;white-space:pre-wrap;font-size:11.5px;' +
        'line-height:1.6;color:var(--paper2,#c8c6be);}' +
      '.cq-error{text-align:center;padding:30px 16px;color:var(--rojo2,#e06060);}';
    document.head.appendChild(s);
  }

  // ── INTEGRACIÓN CON LA NAVEGACIÓN (clase "on", igual que goTab) ────────────
  function montar() {
    if (document.getElementById('pg-condos')) return; // idempotente
    inyectarEstilos();

    var ref = document.getElementById('pg-dash');
    if (!ref || !ref.parentNode) return;

    var pg = document.createElement('div');
    pg.className = 'page';
    pg.id = 'pg-condos';
    ref.parentNode.appendChild(pg);

    var bar = document.querySelector('.tab-bar');
    if (bar) {
      var item = document.createElement('div');
      item.className = 'tab-item';
      item.id = 'tab-condos';
      item.innerHTML = '<div class="tab-ico">🏘</div><div class="tab-lbl">Condominios</div>';
      item.addEventListener('click', abrirModulo);
      bar.appendChild(item);
    }
  }

  function abrirModulo() {
    // Misma mecánica que goTab: solo clases, nunca estilos inline.
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('on'); });
    document.querySelectorAll('.tab-item').forEach(function (t) { t.classList.remove('on'); });
    var pg = document.getElementById('pg-condos'); if (pg) pg.classList.add('on');
    var tb = document.getElementById('tab-condos'); if (tb) tb.classList.add('on');
    var sa = document.getElementById('scroll-area'); if (sa) sa.scrollTop = 0;
    renderLista();
  }

  window.PCCondominios = { abrir: abrirModulo, lista: function () { return condos.slice(); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
