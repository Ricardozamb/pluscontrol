/* ============================================================================
   MÓDULO: PLAN DE EMERGENCIA Y EVACUACIÓN PARA CONDOMINIOS — v2 (AUDITADO)
   Plus Control SpA — tipo de documento: emergencia_condominio
   Base legal: Ley 21.442 Art. 40 + Reglamento MINVU (D.O. 09-01-2025)

   CORRECCIONES v2:
   1. Generación POR PARTES (7 llamadas) — max_tokens del servidor es 8192 y
      una sola llamada truncaba el documento a media frase.
   2. docType selecciona el contexto de condominios en el servidor.
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
  var storageSnapshot;
  var generating = false;
  try {
    storageSnapshot = localStorage.getItem('pc_condominios');
    var saved = JSON.parse(storageSnapshot || '[]');
    if (Array.isArray(saved)) condos = saved;
    else storageSnapshot = undefined;
  } catch (e) { storageSnapshot = undefined; }

  function saveCondos(next) {
    try {
      if (storageSnapshot === undefined || localStorage.getItem('pc_condominios') !== storageSnapshot) {
        alert('El almacenamiento cambió en otra pestaña o no se puede leer. Recarga y revisa antes de guardar.');
        return false;
      }
      var serialized = JSON.stringify(next);
      localStorage.setItem('pc_condominios', serialized);
      storageSnapshot = serialized;
      condos = next;
      return true;
    } catch (err) {
      alert('No se pudo guardar. Espacio insuficiente: exporte un respaldo. Nunca se borrarán planes anteriores automáticamente.');
      return false;
    }
  }

  function exportarJSON() {
    var b = new Blob([JSON.stringify({ condominios: condos }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'condominios-pluscontrol-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function esPlanGuardado(plan) {
    return plan && typeof plan.texto === 'string' && Number.isFinite(plan.fecha) &&
      (!plan.datos || (typeof plan.datos === 'object' && !Array.isArray(plan.datos)));
  }

  async function importarJSON(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('El respaldo supera el límite de 10 MB.'); return; }
    try {
      var data = JSON.parse(await file.text());
      var rows = data.condominios;
      if (!Array.isArray(rows) || !rows.every(function (c) {
        return c && Number.isSafeInteger(c.id) && typeof c.nombre === 'string' &&
          (!c.ultimo_plan || esPlanGuardado(c.ultimo_plan)) &&
          (!c.planes_anteriores || (Array.isArray(c.planes_anteriores) && c.planes_anteriores.every(esPlanGuardado)));
      }) || new Set(rows.map(function (c) { return c.id; })).size !== rows.length) {
        throw new Error('Formato inválido');
      }
      var nuevos = rows.filter(function (c) {
        return !condos.some(function (actual) { return actual.id === c.id; });
      });
      if (!nuevos.length) { alert('El respaldo no contiene condominios nuevos.'); return; }
      if (confirm('¿Restaurar ' + nuevos.length + ' condominio(s)? Los registros con el mismo identificador se conservan.')) {
        if (saveCondos(condos.concat(nuevos))) renderLista();
      }
    } catch (err) { alert('No se pudo leer el respaldo de condominios.'); }
  }

  var FORMATO_IMAGEN = /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/;

  function imagenValida(imagen) {
    return imagen && typeof imagen.nombre === 'string' && typeof imagen.url === 'string' &&
      imagen.url.length <= 550000 && FORMATO_IMAGEN.test(imagen.url);
  }

  async function leerImagen(file) {
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 400 * 1024) {
      throw new Error('Usa imágenes JPG o PNG de hasta 400 KB por archivo.');
    }
    var url = await new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    var imagen = { nombre: file.name, url: url };
    if (!imagenValida(imagen)) throw new Error('Formato de imagen inválido.');
    var preview = new Image();
    preview.src = url;
    await preview.decode();
    return imagen;
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function v(id, def) { var el = document.getElementById(id); return el ? (el.value.trim() || def || '') : (def || ''); }
  function chk(id) { var el = document.getElementById(id); return el && el.checked ? 'Sí' : 'No'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x];
    });
  }
  var EVIDENCIAS = [
    ['regimen', 'Antecedente que acredita el régimen del plan'],
    ['inventario', 'Acta o registro de inspección del inventario y mantenciones'],
    ['asistencia', 'Referencia del catastro de asistencia bajo custodia'],
    ['designaciones', 'Acta de designaciones y cobertura por turno'],
    ['revision_tecnica', 'Registro de revisión profesional del plan']
  ];

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
        campo('Región *', 'c-region', val('region'), 'text', ''),
        campo('Rol de avalúo', 'c-rol', val('rol'), 'text', 'Si aplica'),
      ]) +
      grid([
        selectCampo('Tipo de condominio', 'c-tipo', [
          ['Tipo A — unidades en terreno común', 'Tipo A'],
          ['Tipo B — sitios urbanizados de dominio exclusivo', 'Tipo B'],
          ['Mixto', 'Mixto'],
        ], d.tipo),
        selectCampo('Situación del plan', 'c-situacion', [
          ['Situación jurídica por determinar', 'pendiente'],
          ['Actualización (condominio existente)', 'actualizacion'],
          ['Primer plan (condominio nuevo)', 'primer_plan'],
          ['Primer plan de condominio preexistente: revisar supuesto legal', 'regularizacion'],
        ], d.situacion),
      ]) +
      grid([
        campo('Fecha de elaboración', 'c-fecha', val('fecha_elab'), 'date', ''),
        campo('Actualización anterior', 'c-fecha-ant', val('fecha_ant'), 'date', ''),
      ]) +
      selectCampo('¿Comuna costera? — define si se desarrolla el escenario de tsunami', 'c-costera', [
        ['Exposición a tsunami por verificar', ''],
        ['No se ha informado exposición', 'No'],
        ['Sí — se desarrolla procedimiento de tsunami', 'Sí'],
      ], d.costera) +

      seccion('A.1 Foto de portada') +
      '<label class="cq-field">Foto de la entrada (JPG o PNG, hasta 400 KB)<input id="c-foto" type="file" accept="image/jpeg,image/png"></label>' +
      (imagenValida(d.foto) ? check('c-quitar-foto', 'Quitar foto actual: ' + esc(d.foto.nombre), false) : '') +

      seccion('B. Configuración física') +
      grid([
        campo('N° de torres / blocks', 'c-torres', val('torres'), 'text', 'Ej: 3'),
        campo('Identificación de torres', 'c-torres-id', val('torres_id'), 'text', 'Ej: Torre A, B, C'),
      ]) +
      grid([
        campo('N° de pisos por torre', 'c-pisos', val('pisos'), 'text', 'Ej: A:5; B:5; C:4; D:4'),
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
      textareaCampo('Extintores: cantidad, agente, masa y estado de carga verificado', 'c-extintores', val('extintores'), 'Ej.: 5 extintores PQS de 6 kg en Torre A. Estado de carga pendiente de inspección.') +
      textareaCampo('Concentración del polvo químico (PQS) según etiqueta o ficha técnica', 'c-pqs-concentracion', val('pqs_concentracion'), 'Una línea por equipo o grupo: identificador | concentración. Ej.: Torre A | 90%; escribe cada grupo en una línea distinta.') +
      '<p class="cq-note">El porcentaje corresponde a la concentración del agente, no al estado de carga. Si el dato falta, deja el campo vacío o escribe «pendiente» después de la barra vertical.</p>' +
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

      seccion('C.1 Validación por pisos, planos y zonas (pendiente de inspección)') +
      textareaCampo('Inventario por piso (torre|equipo|piso|cantidad)', 'c-equipos-piso', val('equipos_piso'), 'Ej: C|detector|4|3. Un registro en C|detector|5|3 será inválido') +
      textareaCampo('Plano definitivo: código, ubicación de archivo y estado de validación', 'c-plano-info', val('plano_info'), 'PENDIENTE hasta adjuntar y revisar un plano real') +
      textareaCampo('Zonas de encuentro propuestas por torre y validación técnica', 'c-zonas-info', val('zonas_info'), 'Ej: A: sector patio; B: sector patio; C: sector patio; D: sector patio. PENDIENTE DE VALIDACIÓN') +
      textareaCampo('Rutas por torre y piso (torre|piso|recorrido|zona)', 'c-rutas', val('rutas'), 'Una ruta por línea. El nombre de zona debe coincidir con el registrado para la torre.') +
      '<label class="cq-field">Láminas de salidas y evacuación (hasta 4 JPG o PNG de 400 KB cada uno; identifica torre y piso en el nombre)<input id="c-planos" type="file" accept="image/jpeg,image/png" multiple></label>' +
      (Array.isArray(d.planos) && d.planos.length ? check('c-quitar-planos', 'Quitar las láminas actuales: ' + esc(d.planos.filter(imagenValida).map(function (x) { return x.nombre; }).join(', ')), false) : '') +
      seccion('C.2 Evidencia de inspección — indispensable para emisión definitiva') +
      grid([
        selectCampo('Estado del plano', 'c-plano-estado', [['Pendiente', 'pendiente'], ['Revisado con evidencia', 'revisado']], d.plano_estado),
        campo('Responsable revisión del plano', 'c-plano-revisor', val('plano_revisor'), 'text', 'Nombre y cargo'),
        campo('Fecha de revisión de plano', 'c-plano-fecha', val('plano_fecha'), 'date', ''),
      ]) +
      textareaCampo('Evidencia y ubicación verificable del plano', 'c-plano-evidencia', val('plano_evidencia'), 'Identificador de plano, archivo, versión y ubicación comprobable. Usa el control de láminas para adjuntar las imágenes correspondientes.') +
      grid([
        selectCampo('Estado de zonas de encuentro', 'c-zonas-estado', [['Pendientes de inspección', 'pendiente'], ['Inspeccionadas con evidencia', 'inspeccionadas']], d.zonas_estado),
        campo('Responsable de inspección de zonas', 'c-zonas-revisor', val('zonas_revisor'), 'text', 'Nombre y cargo'),
        campo('Fecha inspección de zonas', 'c-zonas-fecha', val('zonas_fecha'), 'date', ''),
      ]) +
      textareaCampo('Evidencia de las zonas y rutas', 'c-zonas-evidencia', val('zonas_evidencia'), 'Mediciones, capacidad, distancias a fachadas, riesgos, accesos, rutas y operación de Bomberos. Solo declarar lo verificado.') +
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
        campo('Propietario para primer plan', 'c-propietario', val('propietario'), 'text', 'Nombre de persona propietaria'),
        campo('Administrador', 'c-admin', val('admin'), 'text', 'Nombre'),
        campo('Empresa administradora', 'c-empresa-admin', val('empresa_admin'), 'text', 'Ej: Admilagos'),
      ]) +
      grid([
        campo('Presidente del Comité de Administración', 'c-presidente', val('presidente'), 'text', 'Nombre'),
        campo('Coordinador de seguridad / emergencia', 'c-coordinador', val('coordinador'), 'text', 'Si existe'),
      ]) +
      textareaCampo('Líderes de evacuación por torre/piso', 'c-lideres', val('lideres'), 'Deja vacío si aún no se designan') +

      seccion('F.1 Referencias del expediente de revisión') +
      '<p class="cq-note">Registra identificador, fecha, responsable y ubicación del respaldo. Evita ingresar datos personales del catastro.</p>' +
      EVIDENCIAS.map(function (item) {
        return textareaCampo(item[1], 'c-ev-' + item[0], d.evidencias && d.evidencias[item[0]], 'Pendiente hasta contar con respaldo');
      }).join('') +

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
    document.getElementById('c-btn-guardar').addEventListener('click', async function () {
      this.disabled = true;
      try { await guardarCondo(editId, this); }
      catch (err) { alert(err.message || 'No se pudo leer la imagen.'); }
      finally { this.disabled = false; }
    });
    var sa = document.getElementById('scroll-area'); if (sa) sa.scrollTop = 0;
  }

  // ── GUARDAR ────────────────────────────────────────────────────────────────
  async function guardarCondo(editId, boton) {
    for (var i = 0; i < REQ_CONDO.length; i++) {
      var el = document.getElementById(REQ_CONDO[i]);
      if (!el || !el.value.trim()) { alert('Completa los campos obligatorios (*): nombre, dirección, comuna y región.'); return; }
    }
    var previo = editId ? condos.find(function (x) { return x.id === editId; }) : null;
    var obj = {
      id: editId || Date.now(),
      nombre: v('c-nombre'), rut: v('c-rut'), direccion: v('c-dir'), comuna: v('c-comuna'),
      region: v('c-region'), rol: v('c-rol'), tipo: v('c-tipo'), situacion: v('c-situacion'),
      fecha_elab: v('c-fecha'), fecha_ant: v('c-fecha-ant'), costera: v('c-costera'),
      torres: v('c-torres'), torres_id: v('c-torres-id'), pisos: v('c-pisos'), unidades: v('c-unidades'),
      superficie: v('c-superficie'), estac: v('c-estac'), estac_sub: v('c-estac-sub'), estac_sup: v('c-estac-sup'),
      recintos: v('c-recintos'), areas: v('c-areas'),
      rutas: v('c-rutas'), equipos_piso: v('c-equipos-piso'), plano_info: v('c-plano-info'), zonas_info: v('c-zonas-info'),
      plano_estado: v('c-plano-estado','pendiente'), plano_revisor: v('c-plano-revisor'), plano_fecha: v('c-plano-fecha'), plano_evidencia: v('c-plano-evidencia'),
      zonas_estado: v('c-zonas-estado','pendiente'), zonas_revisor: v('c-zonas-revisor'), zonas_fecha: v('c-zonas-fecha'), zonas_evidencia: v('c-zonas-evidencia'),
      extintores: v('c-extintores'), pqs_concentracion: v('c-pqs-concentracion'), red_humeda: v('c-red-humeda'), red_seca: v('c-red-seca'),
      grifos: v('c-grifos'), detectores: v('c-detectores'), alarma: v('c-alarma'), pulsadores: v('c-pulsadores'),
      ilum: v('c-ilum'), generador: v('c-generador'), extincion_auto: v('c-extincion-auto'), senaletica: v('c-senaletica'),
      i_agua: chk('c-i-agua'), i_alcant: chk('c-i-alcant'), i_elec: chk('c-i-elec'), i_gas: chk('c-i-gas'),
      i_calef: chk('c-i-calef'), i_artgas: chk('c-i-artgas'), i_vent: chk('c-i-vent'),
      residentes: v('c-residentes'), ocupadas: v('c-ocupadas'), mov_reducida: v('c-mov-reducida'),
      discapacidad: v('c-discapacidad'), infantes: v('c-infantes'), mayores: v('c-mayores'),
      idioma: v('c-idioma'), conserjeria: v('c-conserjeria'),
      propietario: v('c-propietario'),
      admin: v('c-admin'), empresa_admin: v('c-empresa-admin'), presidente: v('c-presidente'),
      coordinador: v('c-coordinador'), lideres: v('c-lideres'),
      s_plan: chk('c-s-plan'), s_actualizacion: chk('c-s-actualizacion'), s_simulacro: chk('c-s-simulacro'),
      s_capacitacion: chk('c-s-capacitacion'), s_mantencion: chk('c-s-mantencion'),
      s_senaletica: chk('c-s-senaletica'), s_inspeccion: chk('c-s-inspeccion'),
      bomberos: v('c-bomberos'), bomberos_dir: v('c-bomberos-dir'),
      carabineros: v('c-carabineros'), carabineros_dir: v('c-carabineros-dir'),
      hospital: v('c-hospital'), hospital_dir: v('c-hospital-dir'),
    };
    obj.evidencias = Object.fromEntries(EVIDENCIAS.map(function (item) {
      return [item[0], v('c-ev-' + item[0])];
    }));
    var foto = document.getElementById('c-foto').files[0];
    var planos = Array.from(document.getElementById('c-planos').files);
    if (planos.length > 4) throw new Error('Selecciona hasta cuatro láminas por condominio.');
    var quitarFoto = chk('c-quitar-foto') === 'Sí';
    var quitarPlanos = chk('c-quitar-planos') === 'Sí';
    obj.foto = foto ? await leerImagen(foto) : (!quitarFoto && previo && previo.foto) || null;
    obj.planos = planos.length ? await Promise.all(planos.map(leerImagen)) :
      (!quitarPlanos && previo && previo.planos) || [];
    if (!boton.isConnected) return;
    if (planos.length || quitarPlanos) {
      obj.plano_estado = 'pendiente';
      obj.plano_revisor = obj.plano_fecha = obj.plano_evidencia = '';
    }
    // Preserva el plan ya generado al editar (bug corregido de v1).
    if (previo && previo.ultimo_plan) obj.ultimo_plan = previo.ultimo_plan;
    if (previo && previo.planes_anteriores) obj.planes_anteriores = previo.planes_anteriores;

    var next = previo ? condos.map(function (c) { return c.id === editId ? obj : c; }) : condos.concat(obj);
    if (saveCondos(next)) renderLista();
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
               : '<div class="cq-ok">Datos principales ingresados</div>') +
        (auditoriaCondo(c).length
          ? '<div class="cq-warn">' + auditoriaCondo(c).length + ' observación(es) técnicas por resolver</div>'
          : '<div class="cq-ok">Control estructural sin observaciones (requiere revisión profesional)</div>') +
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
        '<button class="cq-btn" id="cq-importar">Restaurar respaldo</button>' +
        '<input type="file" id="cq-archivo" accept=".json,application/json" hidden>' +
      '</div>' + filas + '</div>';

    document.getElementById('cq-nuevo').addEventListener('click', function () { renderCuestionario(null); });
    var archivo = document.getElementById('cq-archivo');
    document.getElementById('cq-importar').addEventListener('click', function () { archivo.click(); });
    archivo.addEventListener('change', function () { importarJSON(archivo.files[0]); archivo.value = ''; });
    var ex = document.getElementById('cq-export'); if (ex) ex.addEventListener('click', exportarJSON);
    Array.prototype.forEach.call(host.querySelectorAll('[data-act]'), function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id, 10), act = this.dataset.act;
        if (act === 'edit') renderCuestionario(id);
        else if (act === 'gen') generarPlan(id);
        else if (act === 'ver') {
          var c = condos.find(function (x) { return x.id === id; });
          if (c && c.ultimo_plan) {
            var plan = c.ultimo_plan;
            var base = plan.datos || { nombre: c.nombre };
            var avisos = plan.datos ? auditoriaCondo(base) : ['Versión antigua sin copia verificable del levantamiento original.'];
            finalizar(base, plan.texto, validarDocumento(plan.texto, base).concat(avisos));
          }
        } else if (act === 'del') {
          if (confirm('¿Eliminar este condominio y su levantamiento?')) {
            if (saveCondos(condos.filter(function (x) { return x.id !== id; }))) renderLista();
          }
        }
      });
    });
    var sa = document.getElementById('scroll-area'); if (sa) sa.scrollTop = 0;
  }

  // ── SYSTEM PROMPT PROPIO (no hereda el de empresas) ────────────────────────
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
      d('RÉGIMEN DECLARADO', c.situacion, 'PENDIENTE'),
      d('FECHA DE ELABORACIÓN', c.fecha_elab),
      d('ACTUALIZACIÓN ANTERIOR', c.fecha_ant, 'SIN ANTECEDENTE REGISTRADO'),
      d('INDICIO DE EXPOSICIÓN COSTERA', c.costera, 'PENDIENTE'),
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
      d('EXTINTORES (masa nominal y estado de carga)', c.extintores),
      d('CONCENTRACIÓN DEL AGENTE PQS POR EQUIPO O GRUPO SEGÚN ETIQUETA; NO ES CARGA', c.pqs_concentracion, 'PENDIENTE SI APLICA'),
      d('RED HÚMEDA', c.red_humeda, '[NO INFORMADO]'),
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
      d('PROPIETARIO (PRIMER PLAN)', c.propietario, '[PENDIENTE DE IDENTIFICACIÓN]'),
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
    { label: 'Capítulos 1 a 3', instr:
      'Genera SOLO estas secciones:\n' +
      '## CAPÍTULO 1 — INTRODUCCIÓN Y MARCO LEGAL (finalidad del plan; identificación del condominio con sus datos reales; obligación del Artículo 40 de la Ley N°21.442; Reglamento de la ley publicado el 09-01-2025; referencia a la norma técnica oficial del MINVU del artículo 4° transitorio; describe el régimen declarado sujeto a revisión; omite el bloque de firmas, que agrega la aplicación).\n' +
      '## CAPÍTULO 2 — OBJETIVOS Y ALCANCE (objetivo general, objetivos específicos, alcance territorial y de personas).\n' +
      '## CAPÍTULO 3 — DEFINICIONES (emergencia, evacuación, evacuación parcial, evacuación total, vía de evacuación, zona de seguridad, punto de encuentro, alerta, alarma, amenaza, vulnerabilidad, emergencia controlada).' },
    { label: 'Capítulo 4 — Descripción del condominio', instr:
      'Genera SOLO este capítulo, sin repetir la introducción ni otros capítulos.\n' +
      '## CAPÍTULO 4 — DESCRIPCIÓN DEL CONDOMINIO (configuración física, unidades, población, recintos críticos y sistemas de emergencia existentes; usa una tabla markdown para el resumen de sistemas). Solo datos reales; lo pendiente se declara pendiente.' },
    { label: 'Pasos I y II', instr:
      'Genera SOLO estas secciones:\n' +
      '## PASO I — ORGANIZACIÓN ANTE UNA EMERGENCIA (comité de administración, administrador, coordinador de emergencia/seguridad, conserjería, líderes de evacuación por torre y piso, personal de apoyo; responsabilidades detalladas de cada rol). Si un cargo no está designado, describe la función y deja el responsable como pendiente de designación.\n' +
      '## PASO II — PLAN GENERAL DE EMERGENCIA Y EVACUACIÓN (detección; formas de dar la alerta; alarma; comunicación interna; evaluación; criterios de decisión de evacuación; evacuación parcial; evacuación total; vías de evacuación; zonas de seguridad; puntos de encuentro; control de acceso durante la emergencia; coordinación con organismos externos; condiciones para el retorno).' },
    { label: 'Incendio', instr:
      'Genera SOLO esta sección, muy desarrollada:\n' +
      '## PASO III — PROCEDIMIENTOS POR EMERGENCIA ESPECÍFICA\n' +
      '### 3.1 INCENDIO (detección; alerta temprana; aviso a conserjería; activación de alarma; llamado a Bomberos 132; evaluación inicial; decisión de evacuación; cierre de puertas cuando sea seguro; prohibición de ascensores cuando corresponda; desplazamiento por vías señalizadas; llegada a zona de seguridad; recuento de personas; apoyo a personas con movilidad reducida; coordinación con Bomberos a su llegada; condiciones de retorno). Estructura en ANTES, DURANTE y DESPUÉS. Incluye el uso de extintor SOLO como primera respuesta cuando las condiciones de seguridad lo permitan, por personal capacitado, con salida segura disponible. NO instruyas a residentes a enfrentar un incendio desarrollado.\n' +
      'No generes las demás subsecciones: se generan aparte.' },
    { label: 'Sismo, gas, inundación', instr:
      'Genera SOLO estas subsecciones (continúan el PASO III ya generado; NO repitas su encabezado principal):\n' +
      '### 3.2 SISMO O TERREMOTO (antes, durante, después).\n' +
      '### 3.3 TSUNAMI — verificar exposición con cartografía oficial y levantamiento antes de excluir el escenario o definir rutas operativas.\n' +
      '### 3.4 FUGA O ESCAPE DE GAS (antes, durante, después).\n' +
      '### 3.5 INUNDACIÓN (antes, durante, después).\n' +
      '### 3.6 OTRAS EMERGENCIAS IDENTIFICADAS.\n' +
      'Cada procedimiento con alerta, comunicación, evacuación, responsabilidades, coordinación externa y retorno.' },
    { label: 'Evacuación asistida, Paso IV y organismos', instr:
      'Genera SOLO estas secciones:\n' +
      '## PASO III-B — EVACUACIÓN DE PERSONAS QUE REQUIEREN ASISTENCIA (identificación preventiva de necesidades de apoyo; asignación de acompañantes; comunicación; rutas accesibles cuando existan; alternativas cuando una ruta no sea utilizable; prioridad de evacuación según la emergencia; prohibición expresa de maniobras inseguras). No inventes nombres de responsables.\n' +
      '## PASO IV — IMPLEMENTACIÓN DEL PLAN (responsabilidades; capacitación de residentes; comunicación y difusión; inducción a trabajadores del condominio; inspección de instalaciones; mantención de equipos de emergencia; simulacros o ejercicios según los tipos de emergencia; evaluación posterior; actualización al menos anual del plan de evacuación, según el artículo 34 del reglamento).\n' +
      '## COORDINACIÓN CON ORGANISMOS EXTERNOS (describir entrega material y digital a Bomberos y Carabineros de la comuna según el supuesto del artículo 35 del reglamento; incluir registro en blanco para constancia de recepción).' },
    { label: 'Anexos 1 a 7', instr:
      'Genera SOLO los anexos, usando tablas markdown con barras verticales:\n' +
      '## ANEXO 1 — ORGANIZACIÓN Y ENCARGADOS (tabla: Cargo/Rol | Nombre | Contacto | Función. Usa los nombres reales entregados; los que falten van como "[POR DESIGNAR]". NO inventes).\n' +
      '## ANEXO 2 — PLANOS DE EMERGENCIA Y EVACUACIÓN (escribe en una línea independiente exactamente "[LAMINAS DEL LEVANTAMIENTO]" y a continuación: "El plano deberá representar las vías de evacuación, escaleras, salidas, zonas de seguridad, puntos de encuentro, extintores, red húmeda, red seca, grifos o bocas de incendio, grupo electrógeno, iluminación de emergencia, detectores, alarmas, pulsadores, sistemas de extinción, y las instalaciones de agua potable, alcantarillado, electricidad, gas, calefacción, artefactos a gas y ventilaciones asociadas que existan en el condominio." NO inventes ubicaciones).\n' +
      '## ANEXO 3 — DIRECTORIO DE EMERGENCIA (tabla Organismo | Teléfono | Dirección. Nacionales: Bomberos 132, Carabineros 133, SAMU 131. Los datos locales no entregados van como [COMPLETAR / VERIFICAR]. NO inventes números).\n' +
      '## ANEXO 4 — REGISTRO DE MANTENCIÓN E INSPECCIÓN DE EXTINTORES (tabla: N° | Ubicación | Tipo | Masa nominal (kg) | Concentración del agente según etiqueta | Evidencia y fecha de inspección | Estado de carga | Última mantención | Próxima mantención. Solo transcribe filas identificadas individualmente en los datos; deja el registro en blanco cuando solo exista un total agregado).\n' +
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
        body: JSON.stringify({ prompt: prompt, docType: 'condominio' }), signal: ctrl.signal,
      }).then(function (res) {
        if (!res.ok) { clearTimeout(tmt); reintentar('Servidor no disponible (' + res.status + ')', 6000); return; }
        var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
        (function leer() {
          reader.read().then(function (r) {
            if (r.done) {
              clearTimeout(tmt);
              if (full) reject(new Error('La transmisión terminó sin confirmar el cierre de la parte.'));
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
                if (o.done) {
                  clearTimeout(tmt);
                  if (full.trim()) resolve(full);
                  else reject(new Error('Claude devolvió una parte vacía.'));
                  return;
                }
                if (o.error) {
                  clearTimeout(tmt);
                  var esTemporal = [429, 529].includes(o.status) || /RATE_LIMIT|OVERLOADED|429|529|overload/i.test(o.error);
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
    if (!c || generating) return;
    var hallazgos = auditoriaCondo(c);
    var bloqueos = hallazgos.filter(function (x) { return x.startsWith('INCONSISTENCIA:'); });
    if (bloqueos.length) {
      alert('Corrige el levantamiento antes de generar:\n' + bloqueos.join('\n'));
      return;
    }
    if (!confirm('Se generará un borrador para revisión técnica.\n' + hallazgos.join('\n') + '\n¿Continuar?')) return;
    generating = true;
    var datosGuardados = Object.assign({}, c);
    delete datosGuardados.ultimo_plan;
    delete datosGuardados.planes_anteriores;

    var host = document.getElementById('pg-condos');
    host.innerHTML = '<div class="cq-wrap"><div class="cq-gen">' +
      '<h2>Generando Plan de Emergencia</h2>' +
      '<p class="cq-sub">' + esc(c.nombre) + '</p>' +
      '<p class="cq-step" id="cq-step">Preparando…</p>' +
      '<div class="cq-progress"><div class="cq-bar" id="cq-bar"></div></div>' +
      '<pre class="cq-stream" id="cq-stream"></pre>' +
      '<p class="cq-note">Son ' + PARTES.length + ' partes con pausas entre cada una. Puede tardar varios minutos. No cierres la aplicación durante el proceso.</p>' +
      '</div></div>';

    var datos = buildDatosCondo(c) + '\nHallazgos de control: ' + hallazgos.join(' | ') +
      '\nInventario declarado: ' + (c.equipos_piso || 'PENDIENTE') +
      '\nRutas declaradas, no operativas hasta cotejo: ' + (c.rutas || 'PENDIENTE') +
      '\nZonas declaradas, no operativas hasta cotejo: ' + (c.zonas_info || 'PENDIENTE') +
      '\nReferencia de planos (archivo no incorporado): ' + (c.plano_info || 'PENDIENTE') +
      '\nPlanos, recorridos y zonas requieren cotejo documental y en terreno. No des instrucciones operativas locales como definitivas. ' +
      'No atribuyas autoría o firmas. La aplicación muestra los roles de suscripción por separado. Numera cada subsección una sola vez. No conviertas totales agregados en registros individuales ni supongas equipos operativos sin respaldo.';
    var stream = document.getElementById('cq-stream');
    var bar = document.getElementById('cq-bar');
    var step = document.getElementById('cq-step');
    var acumulado = [];

    function hacerParte(i, correccion) {
      if (i >= PARTES.length) {
        var texto = acumulado.join('\n\n');
        generating = false;
        var errores = validarDocumento(texto, c).concat(hallazgos);
        var fechaVersion = Date.now();
        datosGuardados.version_borrador = fechaVersion;
        var siguiente = Object.assign({}, c, {
          ultimo_plan: { fecha: fechaVersion, texto: texto, datos: datosGuardados },
          planes_anteriores: (c.planes_anteriores || []).concat(c.ultimo_plan || [])
        });
        if (!condos.includes(c) || !saveCondos(condos.map(function (x) { return x === c ? siguiente : x; }))) {
          errores.push('Borrador sin guardar. Copia o exporta el resultado antes de salir.');
        }
        finalizar(datosGuardados, texto, errores);
        return;
      }
      var p = PARTES[i];
      step.textContent = 'Parte ' + (i + 1) + ' de ' + PARTES.length + ' — ' + p.label;
      bar.style.width = ((i / PARTES.length) * 100) + '%';
      var parcial = '';
      var indicaciones = correccion ? '\nCorrige estos problemas de la respuesta anterior y devuelve esta parte completa: ' + correccion : '';
      callAPI(datos + '\n\n' + p.instr + indicaciones, function (ch) {
        parcial += ch;
        stream.textContent = parcial.slice(-2500);
        stream.scrollTop = stream.scrollHeight;
      }).then(function (t) {
        var erroresParte = validarParte(t, i, c);
        if (erroresParte.length) throw new Error(erroresParte.join(' '));
        acumulado.push(t.trim());
        // Pausa entre partes: evita gatillar el límite de velocidad de la API.
        step.textContent = 'Parte ' + (i + 1) + ' completada. Preparando la siguiente…';
        setTimeout(function () { hacerParte(i + 1); }, 4000);
      }).catch(function (err) {
        if (!correccion) {
          step.textContent = 'Corrigiendo la parte ' + (i + 1) + ' de ' + PARTES.length + '…';
          setTimeout(function () { hacerParte(i, err.message || 'Respuesta interrumpida.'); }, 4000);
          return;
        }
        generating = false;
        host.innerHTML = '<div class="cq-wrap"><div class="cq-error">' +
          '<h2>Error al generar</h2>' +
          '<p>Parte ' + (i + 1) + ' (' + esc(p.label) + '): ' + esc(err.message || String(err)) + '</p>' +
          '<p class="cq-sub">La corrección automática no se completó. Las ' + i + ' parte(s) verificadas se conservan mientras permanezcas en esta pantalla.</p>' +
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
          generating = true;
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

  // Auditoría estructurada: la presencia de texto NO equivale a una inspección.
  function auditoriaCondo(c) {
    var errores = [];
    var situacion = c.situacion || 'pendiente';
    if (!c.fecha_elab) errores.push('PENDIENTE: falta la fecha de elaboración.');
    EVIDENCIAS.forEach(function (item) {
      if (!referenciaInformada(c.evidencias && c.evidencias[item[0]]))
        errores.push('PENDIENTE: ' + item[1] + '.');
    });
    if (!['primer_plan', 'actualizacion', 'regularizacion'].includes(situacion))
      errores.push('CRÍTICO: falta definir el régimen legal del plan.');
    if (situacion === 'primer_plan' && !String(c.propietario || '').trim())
      errores.push('CRÍTICO: primer plan sin identificación de la persona propietaria.');
    if (situacion === 'regularizacion' && !c.presidente)
      errores.push('CRÍTICO: falta identificar al presidente del comité según el artículo 33 del reglamento.');
    if (situacion === 'actualizacion' && (!c.presidente || !c.admin || !c.fecha_ant))
      errores.push('CRÍTICO: falta identificar firmantes o antecedente de la versión anterior.');
    if (c.fecha_ant && ['primer_plan', 'regularizacion'].includes(situacion))
      errores.push('INCONSISTENCIA: un primer plan registra una actualización anterior.');
    if (c.fecha_ant && c.fecha_elab && c.fecha_ant >= c.fecha_elab)
      errores.push('INCONSISTENCIA: la fecha anterior debe preceder a la fecha de elaboración.');
    if (![c.mov_reducida, c.discapacidad, c.infantes, c.mayores].every(function (x) { return /^\d+$/.test(String(x)); }))
      errores.push('CRÍTICO: falta completar el levantamiento agregado de necesidades de asistencia.');

    var torres = Object.create(null);
    var lista = String(c.pisos || '').split(/[;,\n]+/).filter(function (row) { return row.trim(); });
    lista.forEach(function (row) {
      var m = row.trim().match(/^([A-Z0-9_-]+)\s*:\s*(\d+)$/i);
      if (!m || Number(m[2]) < 1 || Number(m[2]) > 100) {
        errores.push('INCONSISTENCIA: definición de pisos inválida: ' + row);
      } else if (torres[m[1].toUpperCase()]) {
        errores.push('INCONSISTENCIA: torre duplicada en pisos: ' + m[1]);
      } else torres[m[1].toUpperCase()] = Number(m[2]);
    });
    var ids = Object.keys(torres);
    if (!ids.length) errores.push('CRÍTICO: pisos por torre deben informarse como A:5; B:5; C:4; D:4.');
    if (c.torres && /^\d+$/.test(String(c.torres)) && Number(c.torres) !== ids.length)
      errores.push('INCONSISTENCIA: número declarado de torres no coincide con el desglose de pisos.');
    var pqs = String(c.pqs_concentracion || '').trim();
    if (!pqs && /\bPQS\b|POLVO QU[IÍ]MICO/i.test(String(c.extintores || ''))) {
      errores.push('PENDIENTE: registra la concentración del agente PQS por equipo o grupo según etiqueta.');
    }
    pqs.split('\n').filter(function (linea) { return linea.trim(); }).forEach(function (linea) {
      var campos = linea.split('|').map(function (valor) { return valor.trim(); });
      var porcentaje = campos[1] && campos[1].match(/^(\d{1,3}(?:[.,]\d+)?)\s*%?$/);
      if (campos.length !== 2 || !campos[0] ||
          (!/^pendiente$/i.test(campos[1]) && (!porcentaje || Number(porcentaje[1].replace(',', '.')) > 100))) {
        errores.push('INCONSISTENCIA: concentración PQS inválida. Usa equipo o grupo | porcentaje de 0 a 100, o pendiente.');
      } else if (/^pendiente$/i.test(campos[1])) {
        errores.push('PENDIENTE: confirmar la concentración PQS de ' + campos[0] + ' según etiqueta.');
      }
    });
    var referencias = [c.detectores, c.alarma, c.pulsadores, c.extintores].filter(Boolean).join('. ');
    alertasInventario(referencias, c.pisos).forEach(function (hallazgo) {
      errores.push(hallazgo.startsWith('EXTINTORES:') ? 'INCONSISTENCIA: ' + hallazgo : hallazgo);
    });
    if (!String(c.equipos_piso || '').trim()) errores.push('CRÍTICO: inventario por piso pendiente.');
    var equipos = new Set();
    String(c.equipos_piso || '').split(/\n+/).forEach(function(row) {
      if (!row.trim()) return;
      var p = row.split('|'), torre=(p[0]||'').trim().toUpperCase();
      var n = Number((p[2] || '').trim()), cantidad = Number((p[3] || '').trim());
      if (p.length !== 4 || !p[1].trim() || !Number.isInteger(n) || n < 1 ||
          !Number.isInteger(cantidad) || cantidad < 1) {
        errores.push('INCONSISTENCIA: registro de equipo inválido: ' + row);
      } else if (!torres[torre]) {
        errores.push('INCONSISTENCIA: equipo en torre no declarada: ' + torre);
      } else if (n > torres[torre]) {
        errores.push('INCONSISTENCIA: equipo en piso ' + n + ' inexistente de torre ' +
          torre + ' (' + torres[torre] + ' pisos).');
      } else {
        var clave = [torre, norm(p[1].trim()), n].join('|');
        if (equipos.has(clave)) errores.push('INCONSISTENCIA: equipo duplicado: ' + clave);
        equipos.add(clave);
      }
    });

    if (!Array.isArray(c.planos) || !c.planos.some(imagenValida))
      errores.push('CRÍTICO: faltan láminas de evacuación adjuntas.');
    if (c.plano_estado !== 'revisado' || !c.plano_revisor || !c.plano_fecha ||
        !c.plano_info || !c.plano_evidencia)
      errores.push('CRÍTICO: plano no acreditado (identificador, evidencia, fecha y revisor).');
    if (c.zonas_estado !== 'inspeccionadas' || !c.zonas_revisor || !c.zonas_fecha ||
        !c.zonas_evidencia || !c.zonas_info)
      errores.push('CRÍTICO: zonas de encuentro requieren inspección y evidencia de distancias, capacidad, accesos y riesgos.');
    var regiones = Object.create(null);
    String(c.zonas_info || '').split(/[;\n]+/).forEach(function (row) {
      var m=row.trim().match(/^([A-Z0-9_-]+)\s*:\s*(.+)$/i);
      if (!row.trim()) return;
      if (!m || !torres[m[1].toUpperCase()] || regiones[m[1].toUpperCase()]) {
        errores.push('INCONSISTENCIA: zona sin torre válida o duplicada: ' + row);
      } else regiones[m[1].toUpperCase()] = m[2].trim();
    });
    ids.forEach(function(id) {
      if (!regiones[id]) errores.push('CRÍTICO: no hay zona de encuentro registrada para torre ' + id + '.');
    });
    var rutas = new Set();
    String(c.rutas || '').split(/\n+/).filter(function (row) { return row.trim(); }).forEach(function (row) {
      var p = row.split('|').map(function (x) { return x.trim(); });
      var torre = norm(p[0]), piso = Number(p[1]);
      if (p.length !== 4 || !torres[torre] || !/^\d+$/.test(p[1]) || piso < 1 ||
          piso > torres[torre] || !p[2] || !regiones[torre] || norm(p[3]) !== norm(regiones[torre])) {
        errores.push('INCONSISTENCIA: ruta sin piso, recorrido o zona concordante: ' + row);
      } else rutas.add(torre + '|' + piso);
    });
    ids.forEach(function (id) {
      for (var piso = 1; piso <= torres[id]; piso++) {
        if (!rutas.has(id + '|' + piso)) {
          errores.push('CRÍTICO: faltan rutas para uno o más pisos de la torre ' + id + '.');
          break;
        }
      }
    });
    return errores;
  }

  function capitulosFaltantes(texto, requeridos) {
    var romanos = { I: 1, II: 2, III: 3, IV: 4 };
    var encontrados = new Set();
    var actual;
    norm(texto).split('\n').forEach(function (linea) {
      var limpia = linea.replace(/[*_]/g, '').trim();
      var encabezado = limpia.match(/^(?:#{1,6}\s+)?CAPITULO\s+([1-4]|IV|III|II|I)(?=$|[\s.\-–—:])/);
      if (encabezado) {
        actual = romanos[encabezado[1]] || Number(encabezado[1]);
      } else if (/^#{1,2}\s+|^(?:PASO|ANEXO)\s+/.test(limpia)) {
        actual = undefined;
      } else if (actual && !/^#/.test(limpia) && /[A-Z]{2,}/.test(limpia) &&
                 !/^\[.*\]$/.test(limpia)) {
        encontrados.add(actual);
      }
    });
    return requeridos.filter(function (n) { return !encontrados.has(n); });
  }

  function alertasInventario(texto, pisos) {
    var hallazgos = new Set();
    var niveles = new Map(Array.from(norm(pisos).matchAll(/(?:^|[;,\n])\s*([A-Z0-9_-]+)\s*:\s*(\d+)/g),
      function (m) { return [m[1], Number(m[2])]; }));
    var t = norm(texto).replace(/\s+/g, ' ');
    var grupos = /TORRES?\s+([A-Z0-9_-]+(?:\s+Y\s+[A-Z0-9_-]+)?)\s*[:,]?\s*(?:DE\s+)?(\d+)\s+PISOS\b|TORRES?\s+([A-Z0-9_-]+(?:\s+Y\s+[A-Z0-9_-]+)?)\s*[:,]?\s*[^.|;:]{0,100}?\b(?:EN\s+)?(?:LOS\s+)?PISOS?\s+(\d+(?:\s*(?:,|Y)\s*\d+)*)/g;
    for (var m of t.matchAll(grupos)) {
      var ids = (m[1] || m[3]).split(/\s+Y\s+/);
      var numero = m[2] ? Number(m[2]) : Math.max(...m[4].match(/\d+/g).map(Number));
      ids.forEach(function (id) {
        if (niveles.has(id) && (m[2] ? numero !== niveles.get(id) : numero > niveles.get(id))) {
          hallazgos.add('INCONSISTENCIA: revisar referencia a piso(s) de torre ' + id +
            ' frente a los ' + niveles.get(id) + ' pisos declarados.');
        }
      });
    }
    if (/\b(?:OPERATIV[OA]|ESTADO)\s*[—–:-]\s*\d{1,3}\s*%|\b\d{1,3}\s*%\s*(?:DE\s+)?(?:LA\s+)?CARGA\b|\bCARGA\s+(?:DEL?\s+)?\d{1,3}\s*%/.test(t))
      hallazgos.add('EXTINTORES: se informó carga como porcentaje. Coteja la concentración del agente PQS con la etiqueta y registra el estado de carga por separado.');
    return Array.from(hallazgos);
  }

  function seccionesDe(texto) {
    var secciones = [];
    var actual;
    norm(texto).split('\n').forEach(function (linea) {
      var h = linea.replace(/[*_]/g, '').match(/^\s*#{1,4}\s+(CAPITULO\s+[1-4]|PASO\s+(?:III-B|IV|III|II|I)|ANEXO\s+[1-7]|3\.[1-6]|COORDINACION CON ORGANISMOS EXTERNOS)(?=$|[\s.\-–—:(])/);
      if (h) {
        actual = { id: h[1].replace(/\s+/g, ' '), contenido: false };
        secciones.push(actual);
        return;
      }
      if (!actual) return;
      if (linea.trim() === '[LAMINAS DEL LEVANTAMIENTO]') actual.laminas = true;
      if (/^\s*#{1,2}\s/.test(linea)) { actual = undefined; return; }
      if (!/^\s*(?:#|\[)/.test(linea) && /[A-Z]{2,}/.test(linea)) actual.contenido = true;
    });
    return secciones;
  }

  function validarParte(texto, indice, condo) {
    var esperadas = seccionesDe(PARTES[indice].instr).map(function (s) { return s.id; });
    var secciones = seccionesDe(texto);
    var encontradas = secciones.map(function (s) { return s.id; });
    var errores = [];
    if (esperadas.join('|') !== encontradas.join('|')) {
      errores.push('Entrega exactamente estas secciones, en orden y una vez cada una: ' + esperadas.join(', ') + '.');
    }
    secciones.forEach(function (s) {
      if (!s.contenido && s.id !== 'PASO III') errores.push('Falta contenido en ' + s.id + '.');
    });
    if (esperadas.includes('ANEXO 2') &&
        (!secciones.some(function (s) { return s.id === 'ANEXO 2' && s.laminas; }) ||
         (texto.match(/^\[LAMINAS DEL LEVANTAMIENTO\]$/gm) || []).length !== 1)) {
      errores.push('Falta la línea de inserción de planos en el anexo 2.');
    }
    return errores.concat(validarDocumento(texto, condo).filter(function (e) {
      return /^(?:INCONSISTENCIA|EXTINTORES|FIRMAS|RIESGO|CRÍTICO):|^ESTRUCTURA: numeración repetida|^LEGAL: aparece/.test(e) ||
        (esperadas.includes('CAPITULO 1') && e.startsWith('LEGAL: no se menciona'));
    }));
  }

  function validarDocumento(texto, c) {
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
    capitulosFaltantes(t, [1, 2, 3, 4]).forEach(function (n) {
      errores.push('ESTRUCTURA: falta el capítulo ' + n + ' o su contenido.');
    });
    ['PASO I', 'PASO II', 'PASO III', 'PASO IV']
      .forEach(function (s) { if (T.indexOf(s) === -1) errores.push('ESTRUCTURA: falta ' + s + '.'); });
    for (var a = 1; a <= 7; a++) if (T.indexOf('ANEXO ' + a) === -1) errores.push('ESTRUCTURA: falta el ANEXO ' + a + '.');
    if (/\[PLANO A CARGAR POR PLUS CONTROL\]/i.test(t)) errores.push('CRÍTICO: el plano de evacuación todavía no está incorporado.');
    // Firmas
    if (/FIRMADO POR|SUSCRITO POR\s*:/i.test(t))
      errores.push('FIRMAS: revisar una posible atribución de firma en el texto generado.');
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
    if (/PUNTO DE ENCUENTRO PROVISORI[OA]|ZONA DE SEGURIDAD PROVISORI[OA]/.test(T))
      errores.push('RIESGO: punto de encuentro provisorio que requiere inspección antes de dar instrucciones.');
    errores = errores.concat(alertasInventario(t, c && c.pisos));
    var numeracion = new Set();
    var contexto = '';
    t.split('\n').forEach(function (linea) {
      var h = norm(linea).match(/^\s*#{1,3}\s+(?:(CAPITULO|PASO|ANEXO)\s+(\w+)|(\d+\.\d+)\.?\s)/);
      if (!h) return;
      if (h[1]) contexto = h[1] + ' ' + h[2];
      else if (contexto) {
        var clave = contexto + ' / ' + h[3];
        if (numeracion.has(clave)) errores.push('ESTRUCTURA: numeración repetida ' + clave + '.');
        numeracion.add(clave);
      }
    });
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
        : '<div class="cq-val cq-val-ok"><strong>Control mecánico: sin observaciones.</strong> La revisión profesional y el cotejo en terreno siguen pendientes.</div>') +
      '<div class="cq-actions">' +
        '<button class="cq-btn cq-btn-p" id="cq-print">Exportar borrador PDF no firmado</button>' +
        '<button class="cq-btn" id="cq-word">Descargar Word editable (.docx)</button>' +
        '<button class="cq-btn" id="cq-copy">Copiar texto</button>' +
        '<button class="cq-btn" id="cq-volver">Volver</button>' +
      '</div><p class="cq-note">Borrador no firmado para revisión profesional y en terreno.</p><pre class="cq-doc" id="cq-doc"></pre></div>';
    document.getElementById('cq-doc').textContent = texto;
    document.getElementById('cq-volver').addEventListener('click', renderLista);
    document.getElementById('cq-copy').addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText('BORRADOR NO FIRMADO — PENDIENTE DE VALIDACIÓN\n\n' + texto).then(function () { alert('Texto copiado.'); });
      else alert('Copia manual desde el cuadro de texto.');
    });
    document.getElementById('cq-word').addEventListener('click', async function () {
      this.disabled = true;
      try { await descargarWord(c, texto, errores); }
      catch (err) { alert(err.message || 'No se pudo descargar Word.'); }
      finally { this.disabled = false; }
    });
    document.getElementById('cq-print').addEventListener('click', function () { imprimirPlan(c, texto, errores); });
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
  function rolesSuscripcion(c) {
    var roles = [{ cargo: 'Ingeniero/a en prevención de riesgos', nombre: '' }];
    if (c.situacion === 'primer_plan') roles.push({ cargo: 'Persona propietaria del condominio', nombre: c.propietario });
    if (['actualizacion', 'regularizacion'].includes(c.situacion))
      roles.push({ cargo: 'Presidente del comité de administración', nombre: c.presidente });
    if (c.situacion === 'actualizacion') roles.push({ cargo: 'Administrador del condominio', nombre: c.admin });
    if (!['primer_plan', 'actualizacion', 'regularizacion'].includes(c.situacion))
      roles.push({ cargo: 'Otros firmantes pendientes de determinar', nombre: '' });
    return roles;
  }

  function referenciaInformada(valor) {
    var texto = norm(valor).trim();
    return Boolean(texto && !/^(?:\[?PENDIENTE|NO INFORMAD[OA]|POR VERIFICAR)/.test(texto));
  }

  function expedienteHtml(c) {
    var filas = EVIDENCIAS.map(function (item) {
      return [item[1], c.evidencias && c.evidencias[item[0]]];
    });
    filas.push(['Plano: código y versión', c.plano_info], ['Plano: referencia de revisión', c.plano_evidencia],
      ['Rutas y zonas: evidencia de inspección', c.zonas_evidencia],
      ['Concentración PQS según etiqueta', c.pqs_concentracion]);
    return '<h2>REGISTRO DE ANTECEDENTES Y EVIDENCIAS</h2>' +
      '<p>Referencias declaradas en el levantamiento de esta versión. Cotejar cada respaldo con su original antes de suscribir.</p>' +
      '<table><thead><tr><th>Antecedente</th><th>Referencia declarada</th></tr></thead><tbody>' +
      filas.map(function (fila) {
        return '<tr><td>' + esc(fila[0]) + '</td><td>' +
          (referenciaInformada(fila[1]) ? esc(fila[1]).replace(/\n/g, '<br>') : 'Pendiente') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function htmlPlan(c, texto, errores) {
    var fecha = c.fecha_elab
      ? new Date(c.fecha_elab + 'T00:00:00').toLocaleDateString('es-CL')
      : 'Fecha de elaboración pendiente';
    var conv = mdToHtml(texto);
    var laminas = (Array.isArray(c.planos) ? c.planos.filter(imagenValida) : []).map(function (plano, i) {
      return '<figure class="lamina"><img src="' + esc(plano.url) + '" alt="Lámina de evacuación">' +
        '<figcaption>Lámina ' + (i + 1) + ' · ' + esc(plano.nombre) + '</figcaption></figure>';
    }).join('');
    var anexo = laminas ? '<p>Láminas aportadas al levantamiento. Cotejar vigencia, cobertura y condiciones en terreno.</p>' + laminas
      : '<p>Láminas de evacuación pendientes de adjuntar.</p>';
    if (conv.html.includes('<p>[LAMINAS DEL LEVANTAMIENTO]</p>')) {
      conv.html = conv.html.replace('<p>[LAMINAS DEL LEVANTAMIENTO]</p>', function () { return anexo; });
    } else if (laminas) conv.html += '<h2>Láminas de evacuación adjuntas</h2>' + anexo;
    conv.indice.push('REGISTRO DE ANTECEDENTES Y EVIDENCIAS', 'SUSCRIPCIÓN DEL PLAN');
    var idx = conv.indice.length >= 3
      ? '<h2>ÍNDICE</h2><ol class="idx">' + conv.indice.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="pb"></div>'
      : '';
    function fbox(nombre, rol, extra) {
      return '<div class="fbox"><div class="fl"></div><div class="fn">' + (nombre ? esc(nombre) : '&nbsp;') + '</div>' +
        '<div class="fr">' + esc(rol) + '</div>' + (extra ? '<div class="fx">' + esc(extra) + '</div>' : '') + '</div>';
    }
    var firmas = '<div class="pb"></div><h2>SUSCRIPCIÓN DEL PLAN — PENDIENTE</h2>' +
      '<p>Espacio destinado a suscripción después de revisión legal y técnica. ESTE BORRADOR NO ESTÁ FIRMADO.</p>' +
      rolesSuscripcion(c).map(function (rol) { return fbox(rol.nombre, rol.cargo); }).join('') +
      '<h3>Control de calidad del borrador</h3><ul>' +
      errores.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';


    return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
      '<title>Plan de Emergencia — ' + esc(c.nombre) + '</title><style>' +
      '@page{size:A4;margin:2.2cm 2cm;}' +
      'body{font-family:Georgia,"Times New Roman",serif;color:#1a1a1a;line-height:1.55;font-size:11pt;margin:0;}' +
      '.portada{text-align:center;padding-top:1.5cm;}' +
      '.foto{display:block;margin:1cm auto;max-width:100%;max-height:8cm;object-fit:contain;}' +
      '.lamina{break-inside:avoid;margin:1em 0;} .lamina img{display:block;max-width:100%;max-height:20cm;margin:auto;}' +
      '.lamina figcaption{font-size:10pt;overflow-wrap:anywhere;}' +
      '.portada h1{font-size:24pt;margin:0 0 .4cm;letter-spacing:.5px;}' +
      '.portada .n{font-size:15pt;font-weight:bold;margin-bottom:.2cm;}' +
      '.portada .d{font-size:11pt;color:#444;}' +
      '.portada .m{margin-top:1cm;font-size:10.5pt;color:#444;line-height:1.9;}' +
      'h2{font-size:13.5pt;color:#7a1f1f;border-bottom:2px solid #7a1f1f;padding-bottom:4px;margin:26px 0 12px;page-break-after:avoid;}' +
      'h3{font-size:12pt;color:#333;margin:18px 0 8px;page-break-after:avoid;}' +
      'p{margin:6px 0;text-align:justify;}' +
      'ul{margin:6px 0 6px 18px;} li{margin:3px 0;}' +
      'ol.idx{font-size:10.5pt;} ol.idx li{margin:4px 0;}' +
      'table{width:100%;table-layout:fixed;border-collapse:collapse;margin:10px 0;font-size:9pt;overflow-wrap:anywhere;}' +
      'thead{display:table-header-group;} tr{break-inside:avoid;} p,li{orphans:3;widows:3;}' +
      '.estado{border:2px solid #922;padding:10px;font:bold 14px Arial;color:#922;text-align:center;}' +
      'th{background:#f0ecec;border:1px solid #999;padding:5px 6px;text-align:left;font-size:8.5pt;}' +
      'td{border:1px solid #bbb;padding:5px 6px;vertical-align:top;height:18px;}' +
      '.pb{page-break-after:always;}' +
      '.fbox{margin-top:1.5cm;page-break-inside:avoid;}' +
      '.fl{border-top:1px solid #333;width:8cm;margin-bottom:5px;}' +
      '.fn{font-weight:bold;font-size:10.5pt;} .fr{font-size:10pt;} .fx{font-size:9.5pt;color:#555;}' +
      '.legal{margin-top:1.5cm;font-size:9pt;color:#555;font-style:italic;border-top:1px solid #ccc;padding-top:8px;}' +
      '</style></head><body>' +
      '<div class="portada"><p class="estado">BORRADOR NO FIRMADO · PENDIENTE DE VALIDACIÓN TÉCNICA Y PLANOS</p><h1>PLAN DE EMERGENCIA<br>Y EVACUACIÓN</h1>' +
      '<div class="n">' + esc(c.nombre) + '</div>' +
      '<div class="d">' + esc(c.direccion || '') + (c.comuna ? ', ' + esc(c.comuna) : '') +
      (c.region ? ', Región de ' + esc(c.region) : '') + '</div>' +
      (imagenValida(c.foto) ? '<img class="foto" src="' + esc(c.foto.url) + '" alt="Entrada del condominio">' : '') +
      '<div class="m">Marco de referencia: artículo 40 de la Ley N°21.442<br>sobre Copropiedad Inmobiliaria<br><br>' +
      'Plus Control SpA — RUT 77.916.708-9<br>Revisión profesional pendiente<br><br>' +
      esc(fecha) + (Number.isFinite(c.version_borrador) ? '<br>Versión PC-' + c.version_borrador.toString(36).toUpperCase() : '') +
      '</div></div><div class="pb"></div>' +
      idx + conv.html + expedienteHtml(c) + firmas + '</body></html>';

  }

  async function descargarWord(c, texto, errores) {
    var html = htmlPlan(c, texto, errores).split('</head><body>')[1].split('</body></html>')[0]
      .replace(/class="pb"/g, 'class="page-break"');
    var response = await fetch('/api/condominios/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: html })
    });
    if (!response.ok) {
      var result = await response.json().catch(function () { return {}; });
      throw new Error(result.error || 'No se pudo descargar Word. Vuelve a intentarlo.');
    }
    var url = URL.createObjectURL(await response.blob());
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'Borrador - ' + String(c.nombre || 'Plan de emergencia').replace(/[\\/:*?"<>|]/g, '-') + '.docx';
    enlace.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function imprimirPlan(c, texto, errores) {
    var w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana. Permite ventanas emergentes e intenta nuevamente.'); return; }
    w.opener = null;
    w.document.write(htmlPlan(c, texto, errores));
    w.document.close();
    Promise.allSettled(Array.from(w.document.images, function (img) { return img.decode(); }))
      .then(function () { if (!w.closed) w.print(); });
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

  window.PCCondominios = { abrir: abrirModulo, lista: function () { return condos.slice(); }, auditar: auditoriaCondo, validarDocumento: validarDocumento, rolesSuscripcion: rolesSuscripcion, alertasInventario: alertasInventario, htmlPlan: htmlPlan, validarParte: validarParte };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
