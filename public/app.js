// ══════════════════════════════════════════════
// PLUS CONTROL — app.js
// Sistema de Prevencion de Riesgos · Chile 2026
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// SISTEMA DE AUTENTICACION PLUS CONTROL
// ══════════════════════════════════════════════

var USUARIOS = {
  'ricardo': { nombre:'Ricardo Zambrano Luna', cargo:'Administrador', rol:'admin', clave:'pluscontrol2025' },
  'alan':    { nombre:'Alan Bascur Montenegro', cargo:'Ingeniero en Prevención de Riesgos', rol:'iper', clave:'alanbascur2025' }
};

// Permisos por rol
var PERMISOS = {
  admin:      { verDash:true, verEmpresas:true, nueva:true, generar:true, alan:true, config:true },
  iper:       { verDash:true, verEmpresas:true, nueva:false, generar:false, alan:true, config:false },
  secretaria: { verDash:true, verEmpresas:true, nueva:true, generar:true, alan:false, config:false },
  tecnico:    { verDash:true, verEmpresas:true, nueva:false, generar:false, alan:false, config:false }
};

var currentUser = null;

function getSession() {
  try {
    var s = sessionStorage.getItem('pc_session');
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}

function setSession(user) {
  sessionStorage.setItem('pc_session', JSON.stringify(user));
  currentUser = user;
}

function clearSession() {
  sessionStorage.removeItem('pc_session');
  currentUser = null;
}

function checkLogin() {
  var session = getSession();
  if (session && USUARIOS[session.username]) {
    currentUser = session;
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  aplicarPermisos();
  // Actualizar saludo
  var saludo = document.getElementById('saludo-nombre');
  if(saludo && currentUser) saludo.textContent = currentUser.nombre.split(' ')[0];
  renderDash();
}

function aplicarPermisos() {
  if (!currentUser) return;
  var perms = PERMISOS[currentUser.rol] || PERMISOS.tecnico;
  // Ocultar tabs segun permisos
  var tabNueva = document.getElementById('tab-nueva');
  var tabGenerar = document.getElementById('tab-generar');
  var tabAlan = document.getElementById('tab-alan');
  if(tabNueva) tabNueva.style.display = perms.nueva ? '' : 'none';
  if(tabGenerar) tabGenerar.style.display = perms.generar ? '' : 'none';
  if(tabAlan) tabAlan.style.display = perms.alan ? '' : 'none';
  // Header buttons
  var hNueva = document.getElementById('hbtn-nueva');
  var hAlan = document.getElementById('hbtn-alan');
  if(hNueva) hNueva.style.display = perms.nueva ? '' : 'none';
  if(hAlan) hAlan.style.display = perms.alan ? '' : 'none';
}

function doLogin() {
  var username = (document.getElementById('login-user').value || '').trim().toLowerCase();
  var pass = (document.getElementById('login-pass').value || '').trim();
  var errEl = document.getElementById('login-error');
  var user = USUARIOS[username];
  if (user && user.clave === pass) {
    errEl.style.display = 'none';
    setSession({ username: username, nombre: user.nombre, cargo: user.cargo, rol: user.rol });
    showApp();
  } else {
    errEl.style.display = 'block';
    document.getElementById('login-pass').value = '';
  }
}

function doLogout() {
  clearSession();
  showLogin();
}

// Listeners login
// Login listeners - directo, sin DOMContentLoaded (script al final del body)
(function() {
  var btn = document.getElementById('login-btn');
  var passInput = document.getElementById('login-pass');
  if(btn) btn.addEventListener('click', doLogin);
  else console.error('login-btn no encontrado');
  if(passInput) passInput.addEventListener('keypress', function(e){ if(e.key==='Enter') doLogin(); });
})();


// ── NORMATIVA POR RUBRO (actualizada 2026) ──
var NORM = {
  'Construccion':['DS 44/2024 MINTRAB (vigente 01-feb-2025)','Ley 16.744','DS 594/1999 MINSAL','DS 44/2024 MINTRAB Arts.20-21 (coordinacion empleadores, reemplaza DS 78/2010)','Ley 20.123','NCh 433 Of.2009','NCh 349 (andamios)','Protocolo TMERT Res.327/2024','Protocolo PREXOR','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Protocolo CEAL-SM-SUSESO (evaluacion riesgos psicosociales)'],
  'Mineria':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 132/2002 MINMIN','DS 72/1985 MINMIN','Protocolo PREXOR','Protocolo ERA','NCh 2190 explosivos','Convenio OIT 176 ratif.2024','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Industria manufacturera':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Ley 20.123','Protocolo PREXOR','Protocolo TMERT Res.327/2024','DS 148/2003 MINSAL','NCh 382 Of.2004','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Agricultura y ganaderia':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 594 Art.103-107 plaguicidas','DS 157/2005 MINSAL','Protocolo ERA (biologicos y quimicos)','Protocolo TMERT Res.327/2024','Protocolo PREXOR (maquinaria agricola)','Circular SUSESO Olas de Calor 2024','CT Arts.93-105 (trabajadores agricolas)','CT Arts.303-313 (trabajadores agricolas temporada)','DS 4/2013 CONAF (incendios forestales — si hay extraccion maderas)','NCh 382 Of.2004','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Pesca y acuicultura':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DFL 292/1953 Ley Navegacion','Protocolo ERA','Protocolo TMERT Res.327/2024','Convenio OIT 188 pesca','NCh 382 Of.2004','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Servicios de salud':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 6/1985 MINSAL','DS 57/2013 MINSAL','Res.283/2007 MINSAL residuos hospitalarios','DS 148/2003 MINSAL','Protocolo ERA biologicos','Protocolo TMERT Res.327/2024','Ley 21.644/2023 violencia en salud','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Transporte y logistica':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Ley 18.290/1984 Transito','DS 212/1992 MINTRANS','NCh 382 Of.2004 mat.peligrosos','DS 298/1994 carga','DS 72/2019 MINTRANS tacografo','Protocolo TMERT Res.327/2024','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Comercio al por menor':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Ley 20.949/2016 (mod. Ley 20.001) cargas manuales','DS 63/2005 MINTRAB','Protocolo TMERT Res.327/2024','DS 1/2009 MINVU accesibilidad','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Comercio al por mayor':['DS 44/2024 MINTRAB (incl. Arts.20-21 coordinacion empresa principal-contratista)','Ley 16.744','DS 594/1999 MINSAL','Ley 20.949/2016','DS 63/2005 MINTRAB','NCh 382 Of.2004','DS 148/2003 MINSAL','DS 157/2005 MINSAL (plaguicidas y agroquimicos)','DS 594 Art.103-107 (exposicion a plaguicidas)','DS 57/2024 MINSAL (SGA fichas seguridad)','Protocolo ERA (agentes quimicos)','DS 298/1995 MINTRANSP (transporte sustancias peligrosas)','Ley 18.290/1984 (Ley de Transito — licencias)','DS 212/1992 MINTRANS (transporte terrestre)','DS 72/2019 MINTRANS (tacografo)','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Gastronomia y restaurantes':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 977/1996 MINSAL Reg.Sanitario Alimentos','DS 594 Art.55-60 cocinas','Ley 20.949/2016','DS 63/2005 MINTRAB','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Saneamiento ambiental':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 157/2005 MINSAL empresas plaguicidas','DS 594 Art.103-107 quimicos','Protocolo ERA','NCh 382 Of.2004','NCh 2245 Of.2003 fichas seguridad','DS 57/2024 MINSAL (SGA — Sistema Globalmente Armonizado fichas seguridad)','DS 148/2003 MINSAL','Resolucion SEREMI habilitacion sanitaria','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Proteccion contra incendios':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','NCh 934 Of.2008 extintores','NCh 1914 Of.2005 cilindros gases comprimidos','NCh 1433 Of.1977 redes agua','NCh 935 pruebas fuego','NCh 2095 sistemas fijos extincion','NCh 382 Of.2004 sustancias peligrosas','DS 594 Art.44-54 prevencion incendios','DS 298/1995 MINTRANSP transporte sustancias peligrosas','Ley 20.949/2016 cargas manuales','DS 63/2005 MINTRAB','Protocolo PREXOR ruido','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Silvicultura y forestal':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 4/2013 CONAF incendios forestales','Ley 20.123','Protocolo ERA','Protocolo TMERT Res.327/2024','NCh 382 Of.2004','DS 148/2003 MINSAL','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Servicios de seguridad':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DFL 3607/1981 Vigilancia Privada','DS 93/1985 INTERIOR','DS 1773/1994 INTERIOR armas','Protocolo TMERT Res.327/2024','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Educacion':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 548/1988 MINEDUC establecimientos','DS 1/2009 MINVU accesibilidad','Protocolo TMERT Res.327/2024','Ley 21.643 Ley Karin 2024 esp.relevancia','DS 2/2024 MINTRAB','Ley 20.536 violencia escolar','NCh 934 Of.2008','Ley 21.645/2023'],
  'Hoteleria y turismo':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 977/1996 MINSAL alimentos','DS 222/1980 MINSAL hoteles','Ley 20.949/2016','DS 63/2005 MINTRAB','DS 1/2009 MINVU','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Tecnologia y comunicaciones':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Protocolo TMERT Res.327/2024','DS 18/2020 MINTRAB teletrabajo','Ley 21.220/2020 trabajo distancia','DS 1/2009 MINVU','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Energia y utilities':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','NCh Elec.4/2003 instalaciones electricas','Ley 20.123','Protocolo PREXOR','Protocolo ERA','DS 148/2003 MINSAL','NCh 382 Of.2004','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'default':['DS 44/2024 MINTRAB (vigente 01-feb-2025)','Ley 16.744','DS 594/1999 MINSAL','Codigo del Trabajo Art.153-157 y 184','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 20.123','NCh 934 Of.2008','Protocolo CEAL-SM-SUSESO (evaluacion riesgos psicosociales)','Circular SUSESO Olas de Calor 2024 (si hay trabajo exterior)']
};

var RIESGOS_B = {
  'Construccion':['Caida de altura','Golpes con herramientas','Aplastamiento','Exposicion a polvo de silice','Electrocucion','Derrumbe'],
  'Mineria':['Derrumbe de galerias','Exposicion a gases toxicos','Explosion','Caida de rocas','Ruido industrial'],
  'Industria manufacturera':['Atrapamiento en maquinaria','Ruido excesivo','Exposicion a quimicos','Incendio','Sobreesfuerzo fisico'],
  'Agricultura y ganaderia':['Aplastamiento o golpe por animal bovino (vacas, toros, novillos)','Accidente con tractor agricola o maquinaria de alto tonelaje','Exposicion a plaguicidas herbicidas y fungicidas','Zoonosis: brucelosis y leptospirosis en lecheros y ternereros','Fatiga y somnolencia en trabajo nocturno (turno lecheria)','Golpe de calor en verano o hipotermia en invierno (trabajo exterior)','Caidas en terreno irregular o pendiente en faenas forestales','Sobreesfuerzo por manipulacion de cargas pesadas (forraje, insumos)','Ruido de maquinaria agricola superior a 85 dB','Accidente en trabajo en solitario en fundo alejado'],
  'Pesca y acuicultura':['Caida al agua','Hipotermia','Aplastamiento por aparejos','Cortes','Sobreesfuerzo'],
  'Servicios de salud':['Exposicion agentes biologicos','Pinchazo con agujas','Sobreesfuerzo al movilizar pacientes','Estres laboral','Violencia de usuarios'],
  'Saneamiento ambiental':['Intoxicacion por plaguicidas','Exposicion a biocidas','Mordeduras y picaduras','Caidas en espacios confinados'],
  'Proteccion contra incendios':['Explosion o sobrexpresurización cilindro a presión','Intoxicacion por CO2 en espacio reducido','Golpe o aplastamiento por cilindro caído','Sobreesfuerzo por manipulacion extintores','Caida desde escalera en instalacion','Accidente de transito con carga peligrosa','Exposicion a polvo quimico seco PQS','Cortes con herramientas de mantencion'],
  'Comercio al por mayor':['Intoxicacion o exposicion a plaguicidas y agroquimicos','Accidente de transito con camion de alto tonelaje','Aplastamiento por carga en descarga','Sobreesfuerzo en manipulacion de sacos y bultos pesados','Exposicion a polvo quimico fertilizantes','Incendio por almacenamiento de sustancias inflamables','Caida al mismo nivel en bodega','Vibraciones cuerpo entero en conduccion vehiculos pesados'],
  'default':['Caidas al mismo nivel','Sobreesfuerzo fisico','Exposicion a ruido','Incendio','Cortes y heridas','Estres laboral']
};

var TIPO_N = {
  riohs:'Reglamento Interno de Orden, Higiene y Seguridad (RIOHS)',
  iper:'Matriz de Identificacion de Peligros y Evaluacion de Riesgos (IPER)',
  pts:'Procedimiento de Trabajo Seguro (PTS)',
  emergencia:'Plan de Emergencia y Evacuacion',
  fuf:'Formulario Unico de Fiscalizacion DS 44/2024',
  karin:'Protocolo de Prevencion y Sancion de Violencia Laboral (Ley Karin)',
  capacitacion:'Programa de Capacitacion Anual en Seguridad y Salud',
  derechosaber:'Derecho a Saber — Informacion de Riesgos por Puesto (DS 44/2024 Art.14)'
};

// ── ESTADO ──
var emps = JSON.parse(localStorage.getItem('pc_emps')||'[]');
var docs = JSON.parse(localStorage.getItem('pc_docs')||'[]');
function saveData(){
  localStorage.setItem('pc_emps',JSON.stringify(emps));
  localStorage.setItem('pc_docs',JSON.stringify(docs));
  // Sincronizar en segundo plano
  syncToCloud().catch(function(){});
}

async function syncToCloud(){
  try {
    localStorage.setItem('pc_backup',JSON.stringify({emps:emps,docs:docs,ts:Date.now()}));
  } catch(e){}
}

async function loadFromCloud(){
  try {
    var backup=localStorage.getItem('pc_backup');
    if(backup){
      var data=JSON.parse(backup);
      if(data.emps&&data.emps.length>0){
        data.emps.forEach(function(ce){if(!emps.find(function(e){return e.id===ce.id;}))emps.push(ce);});
        if(data.docs)data.docs.forEach(function(cd){if(!docs.find(function(d){return d.id===cd.id;}))docs.push(cd);});
        localStorage.setItem('pc_emps',JSON.stringify(emps));
        localStorage.setItem('pc_docs',JSON.stringify(docs));
        return true;
      }
    }
  } catch(e){}
  return false;
}

function exportarDatos(){
  var b=new Blob([JSON.stringify({emps:emps,docs:docs})],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download='pluscontrol-backup.json';a.click();
}

function importarDatos(){
  var input=document.createElement('input');
  input.type='file';input.accept='.json';
  input.onchange=function(ev){
    var file=ev.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        if(data.emps)data.emps.forEach(function(ce){if(!emps.find(function(x){return x.id===ce.id;}))emps.push(ce);});
        if(data.docs)data.docs.forEach(function(cd){if(!docs.find(function(x){return x.id===cd.id;}))docs.push(cd);});
        saveData();renderDash();renderEmps();
        alert('Datos importados correctamente.');
      }catch(err){alert('Error al leer el archivo.');}
    };
    reader.readAsText(file);
  };
  input.click();
}
function goTab(id){
  // Verificar permisos
  if(currentUser){
    var perms=PERMISOS[currentUser.rol]||PERMISOS.tecnico;
    if(id==='nueva'&&!perms.nueva) return;
    if(id==='generar'&&!perms.generar) return;
    if(id==='alan'&&!perms.alan) return;
  }
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('on');});
  document.querySelectorAll('.tab-item').forEach(function(t){t.classList.remove('on');});
  var pg=document.getElementById('pg-'+id);
  if(pg) pg.classList.add('on');
  var tb=document.getElementById('tab-'+id);
  if(tb) tb.classList.add('on');
  var sa=document.getElementById('scroll-area'); if(sa) sa.scrollTop=0;
  if(id==='dash') renderDash();
  if(id==='empresas') renderEmps();
  if(id==='generar') initGen();
  if(id==='alan') renderAlan();
  if(id==='nueva') resetForm();
}

// Tab bar - con null checks para evitar errores
function addClick(id, fn){
  var el = document.getElementById(id);
  if(el) el.addEventListener('click', fn);
}
addClick('tab-dash', function(){goTab('dash');});
addClick('tab-empresas', function(){goTab('empresas');});
addClick('tab-nueva', function(){goTab('nueva');});
addClick('tab-generar', function(){goTab('generar');});
addClick('tab-alan', function(){goTab('alan');});
addClick('hbtn-nueva', function(){goTab('nueva');});
addClick('hbtn-alan', function(){goTab('alan');});
addClick('hbtn-logout', function(){ if(confirm('Cerrar sesion?')) doLogout(); });

// ── DASHBOARD ──
function renderDash(){
  var tot=emps.length,td=docs.length;
  var pend=docs.filter(function(d){return d.estado==='pendiente';}).length;
  var firm=docs.filter(function(d){return d.estado==='firmado';}).length;
  document.getElementById('kv1').textContent=tot;
  // Saludo personalizado
  var saludoEl=document.getElementById('saludo-nombre');
  if(saludoEl&&currentUser) saludoEl.textContent=currentUser.nombre.split(' ')[0];
  document.getElementById('kv2').textContent=td;
  document.getElementById('kv3').textContent=pend;
  document.getElementById('kv4').textContent=firm;
  var badge=document.getElementById('badge-alan');
  badge.textContent=pend; badge.style.display=pend>0?'flex':'none';
  document.getElementById('welcome-alert').style.display=tot?'none':'flex';
  var list=document.getElementById('dash-list');
  var empty=document.getElementById('dash-empty');
  if(!tot){list.innerHTML='';list.style.display='none';empty.style.display='block';return;}
  list.style.display='block';empty.style.display='none';
  list.innerHTML=emps.slice(0,5).map(function(e){
    var de=docs.filter(function(d){return d.empresa_id===e.id;});
    var st=de.length?(de.some(function(d){return d.estado==='firmado';})? 'tag-ok':'tag-wait'):'tag-no';
    var sl=de.length?(de.some(function(d){return d.estado==='firmado';})? 'Firmado':'En proceso'):'Sin docs';
    return '<div class="card-item" data-id="'+e.id+'"><div class="ci-ico">'+rubroIco(e.rubro)+'</div><div class="ci-body"><div class="ci-title">'+e.razon+'</div><div class="ci-sub">'+e.rubro+' . '+e.trabajadores+' trab.</div></div><div class="ci-right"><span class="tag '+st+'">'+sl+'</span><span class="ci-arr">></span></div></div>';
  }).join('');
  list.querySelectorAll('.card-item').forEach(function(el){
    el.addEventListener('click',function(){quickGen(parseInt(this.dataset.id));});
  });
}
document.getElementById('link-ver-todas').addEventListener('click',function(){goTab('empresas');});
document.getElementById('link-reg-1').addEventListener('click',function(){goTab('nueva');});

// ── EMPRESAS ──
function renderEmps(lista){
  var data=lista||emps;
  document.getElementById('lbl-count').textContent=data.length+' empresa'+(data.length!==1?'s':'');
  var list=document.getElementById('emp-list');
  var empty=document.getElementById('emp-empty');
  if(!data.length){list.innerHTML='';list.style.display='none';empty.style.display='block';return;}
  list.style.display='block';empty.style.display='none';
  list.innerHTML=data.map(function(e){
    var de=docs.filter(function(d){return d.empresa_id===e.id;});
    var st=de.length?(de.some(function(d){return d.estado==='firmado';})? 'tag-ok':'tag-wait'):'tag-no';
    var sl=de.length?(de.some(function(d){return d.estado==='firmado';})? 'Vigente':'En proceso'):'Sin docs';
    return '<div class="card-item" data-id="'+e.id+'"><div class="ci-ico">'+rubroIco(e.rubro)+'</div><div class="ci-body"><div class="ci-title">'+e.razon+'</div><div class="ci-sub">'+e.ciudad+' . '+e.trabajadores+' trab. . '+(e.mutualidad||'-')+'</div></div><div class="ci-right"><span class="tag '+st+'">'+sl+'</span><span class="ci-arr">></span></div></div>';
  }).join('');
  list.querySelectorAll('.card-item').forEach(function(el){
    el.addEventListener('click',function(){showEmpSheet(parseInt(this.dataset.id));});
  });
}
document.getElementById('srch').addEventListener('input',function(){
  var q=this.value.toLowerCase();
  renderEmps(q?emps.filter(function(e){return (e.razon+e.ciudad+(e.rut||'')).toLowerCase().indexOf(q)>-1;}):emps);
});
function showEmpSheet(id){
  var e=emps.find(function(x){return x.id===id;}); if(!e)return;
  var de=docs.filter(function(d){return d.empresa_id===id;});
  document.getElementById('sheet-title').textContent=e.razon;
  document.getElementById('sheet-body').innerHTML=
    '<div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-bottom:14px">'+
    '<strong>RUT:</strong> '+(e.rut||'-')+'<br>'+
    '<strong>Rubro:</strong> '+e.rubro+'<br>'+
    '<strong>Ubicacion:</strong> '+e.ciudad+', '+e.region+'<br>'+
    '<strong>Trabajadores:</strong> '+e.trabajadores+'<br>'+
    '<strong>Mutualidad:</strong> '+(e.mutualidad||'-')+'<br>'+
    '<strong>Rep. Legal:</strong> '+(e.rep_nombre||'-')+'</div>'+
    '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Normativa Chile 2026</div>'+
    '<div style="margin-bottom:16px">'+(e.normativa||[]).slice(0,5).map(function(n){return '<span class="norma-pill">'+n+'</span>';}).join('')+'</div>'+
    '<div style="font-size:11px;color:var(--muted);margin-bottom:14px">'+de.length+' documento'+(de.length!==1?'s':'')+' generado'+(de.length!==1?'s':'')+'</div>'+
    '<button class="btn btn-primary" id="s-btn-gen">Generar documentos</button>'+
    '<div style="height:8px"></div>'+
    '<button class="btn btn-ghost" style="color:var(--rojo2)" id="s-btn-del">Eliminar empresa</button>';
  document.getElementById('s-btn-gen').addEventListener('click',function(){closeSheet();quickGen(e.id);});
  document.getElementById('s-btn-del').addEventListener('click',function(){closeSheet();delEmp(e.id);});
  openSheet();
}
function delEmp(id){
  if(!confirm('Eliminar empresa y sus documentos?'))return;
  emps=emps.filter(function(e){return e.id!==id;});
  docs=docs.filter(function(d){return d.empresa_id!==id;});
  saveData();renderEmps();renderDash();
}

// ── FORM NUEVA EMPRESA ──
var rCnt=0;
var REQ=['n-razon','n-rut','n-dir','n-ciudad','n-region','n-rep','n-rep-rut','n-rubro','n-sub','n-desc','n-trab','n-mut','n-horario','n-cargos'];
function resetForm(){
  document.querySelectorAll('#pg-nueva .f-in, #pg-nueva .f-ta').forEach(function(el){el.value='';});
  document.querySelectorAll('#pg-nueva .f-sel').forEach(function(el){el.selectedIndex=0;});
  var pisos=document.getElementById('n-pisos'); if(pisos) pisos.value='1';
  document.getElementById('riesgos-box').innerHTML='';
  document.getElementById('sucursales-list').innerHTML='';
  document.getElementById('n-tiene-sucursales').selectedIndex=0;
  document.getElementById('sucursales-container').style.display='none';
  document.getElementById('normas-sec').style.display='none';
  sucCnt=0;rCnt=0;calcProg();
}
function calcProg(){
  var ok=REQ.filter(function(id){var el=document.getElementById(id);return el&&el.value.trim();}).length;
  document.getElementById('prog').style.width=(ok/REQ.length*100)+'%';
}
REQ.forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.addEventListener('input',calcProg);
  if(el) el.addEventListener('change',calcProg);
});

document.getElementById('n-rubro').addEventListener('change',function(){
  calcProg();
  var r=this.value; if(!r)return;
  var normas=NORM[r]||NORM['default'];
  document.getElementById('normas-sec').style.display='block';
  document.getElementById('normas-pills').innerHTML=normas.slice(0,8).map(function(n){return '<span class="norma-pill">'+n+'</span>';}).join('');
  document.getElementById('riesgos-box').innerHTML='';rCnt=0;
  (RIESGOS_B[r]||RIESGOS_B['default']).slice(0,3).forEach(function(rg){addRiesgo(rg);});
});

function addRiesgo(nombre){
  nombre=nombre||'';
  var id=++rCnt;
  var el=document.createElement('div');
  el.className='risk-card';el.id='rc'+id;
  el.innerHTML=
    '<button class="risk-del" id="rdel'+id+'">✕</button>'+
    '<div class="f-group"><label class="f-lbl">Peligro</label><input class="f-in" id="rnom'+id+'" value="'+nombre+'" placeholder="Ej: Trabajo en altura"></div>'+
    '<div class="f-grid" style="gap:8px;margin-bottom:8px">'+
    '<div><label class="f-lbl">Prob 1-5</label><select class="f-sel" id="rp'+id+'"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div>'+
    '<div><label class="f-lbl">Consec 1-5</label><select class="f-sel" id="rc2'+id+'"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div>'+
    '</div>'+
    '<div id="rchip'+id+'"></div>'+
    '<div class="f-group" style="margin-top:8px;margin-bottom:0"><label class="f-lbl">Control</label><input class="f-in" id="rctrl'+id+'" placeholder="Medida de control..."></div>';
  document.getElementById('riesgos-box').appendChild(el);
  document.getElementById('rdel'+id).addEventListener('click',function(){document.getElementById('rc'+id).remove();});
  document.getElementById('rp'+id).addEventListener('change',function(){updChip(id);});
  document.getElementById('rc2'+id).addEventListener('change',function(){updChip(id);});
  updChip(id);
}
function updChip(id){
  var p=parseInt(document.getElementById('rp'+id).value);
  var c=parseInt(document.getElementById('rc2'+id).value);
  var v=p*c;
  var cls=v<=4?'tag-ok':v<=8?'tag-wait':v<=16?'tag-wait':'tag-no';
  var lbl=v<=4?'Trivial':v<=8?'Tolerable':v<=16?'Moderado':v<=24?'Importante':'INTOLERABLE';
  document.getElementById('rchip'+id).innerHTML='<span class="tag '+cls+'">'+v+' - '+lbl+'</span>';
}
function getRiesgos(){
  var result=[];
  for(var i=1;i<=rCnt;i++){
    var el=document.getElementById('rc'+i);
    if(!el)continue;
    var nom=document.getElementById('rnom'+i);
    if(nom&&nom.value.trim()){
      result.push({nombre:nom.value,prob:parseInt(document.getElementById('rp'+i).value||3),cons:parseInt(document.getElementById('rc2'+i).value||3),control:document.getElementById('rctrl'+i).value||''});
    }
  }
  return result;
}
// ── SUCURSALES ──
var sucCnt=0;
function toggleSucursales(){
  var val=document.getElementById('n-tiene-sucursales').value;
  document.getElementById('sucursales-container').style.display=val==='Si'?'block':'none';
  if(val==='Si'&&sucCnt===0) addSucursal();
}
function addSucursal(){
  sucCnt++;
  var id=sucCnt;
  var div=document.createElement('div');
  div.id='suc'+id;
  div.style.cssText='border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:8px';
  div.innerHTML='<div style="font-weight:600;margin-bottom:8px;font-size:13px">Sucursal '+id+'</div>'+
    '<div class="f-group"><label class="f-lbl">Nombre / Descripción</label><input class="f-in" id="snom'+id+'" placeholder="Ej: Sucursal Angol"></div>'+
    '<div class="f-group"><label class="f-lbl">Dirección completa</label><input class="f-in" id="sdir'+id+'" placeholder="Calle, número, ciudad"></div>'+
    '<div class="f-grid">'+
      '<div class="f-group"><label class="f-lbl">Superficie (m²)</label><input class="f-in" id="ssup'+id+'" type="number" placeholder="120"></div>'+
      '<div class="f-group"><label class="f-lbl">N° trabajadores asignados</label><input class="f-in" id="strab'+id+'" type="number" placeholder="2"></div>'+
    '</div>'+
    '<div class="f-group"><label class="f-lbl">Hospital/clínica más cercano</label><input class="f-in" id="shosp'+id+'" placeholder="Nombre, dirección, distancia aprox."></div>';
  document.getElementById('sucursales-list').appendChild(div);
}
function getSucursales(){
  var result=[];
  for(var i=1;i<=sucCnt;i++){
    var nom=document.getElementById('snom'+i);
    if(!nom) continue;
    if(nom.value.trim()||document.getElementById('sdir'+i).value.trim()){
      result.push({
        nombre:nom.value.trim()||'Sucursal '+i,
        direccion:document.getElementById('sdir'+i).value.trim()||'No especificada',
        superficie:document.getElementById('ssup'+i).value.trim()||'',
        trabajadores:document.getElementById('strab'+i).value.trim()||'',
        hospital:document.getElementById('shosp'+i).value.trim()||'No especificado'
      });
    }
  }
  return result;
}

document.getElementById('btn-add-riesgo').addEventListener('click',function(){addRiesgo('');});
document.getElementById('btn-cancelar').addEventListener('click',function(){goTab('dash');});
document.getElementById('btn-guardar').addEventListener('click',function(){
  if(REQ.some(function(id){var el=document.getElementById(id);return !el||!el.value.trim();})){
    alert('Completa todos los campos obligatorios (*)');return;
  }
  var rub=document.getElementById('n-rubro').value;
  function v(id,def){var el=document.getElementById(id);return el?(el.value.trim()||def||''):def||'';}
  emps.push({
    id:Date.now(),
    razon:v('n-razon'),rut:v('n-rut'),direccion:v('n-dir'),ciudad:v('n-ciudad'),region:v('n-region'),
    rubro:rub,subrubro:v('n-sub'),descripcion:v('n-desc'),productos:v('n-productos','No especificado'),
    lugar_trabajo:v('n-lugar-trabajo','Instalaciones propias'),
    trabajadores:parseInt(v('n-trab','1')),mujeres:parseInt(v('n-mujeres','0'))||0,
    mutualidad:v('n-mut'),rep_nombre:v('n-rep'),rep_rut:v('n-rep-rut'),rep_cargo:v('n-cargo','Representante Legal'),
    rep2_nombre:v('n-rep2',''),rep2_rut:v('n-rep2-rut',''),
    email:v('n-email'),telefono:v('n-tel'),
    cargos:v('n-cargos','No especificado'),sindicato:v('n-sindicato','No'),
    embarazo:v('n-embarazo','No'),menores:v('n-menores','No'),discapacidad:v('n-discapacidad','No'),
    horario:v('n-horario','Lunes a Viernes 08:00-18:00'),horas_semanales:v('n-horas','42'),
    jornada:v('n-jornada','Ordinaria'),horas_extra:v('n-horas-extra','No'),
    superficie:v('n-superficie',''),pisos:v('n-pisos','1'),publico:v('n-publico','No'),
    maquinaria:v('n-maquinaria','No especificado'),sustancias:v('n-sustancias','Ninguna'),
    ruido:v('n-ruido','No se sabe'),polvo:v('n-polvo','No'),temperatura:v('n-temperatura','No'),
    biologico:v('n-biologico','No'),vibracion:v('n-vibracion','No'),radiacion:v('n-radiacion','No'),
    trab_altura:v('n-altura','No'),trab_caliente:v('n-caliente','No'),trab_confinado:v('n-confinado','No'),
    trab_vehiculos:v('n-vehiculos','No'),trab_presion:v('n-presion','No'),trab_nocturno:v('n-nocturno','No'),
    tareas_peligrosas:v('n-tareas-peligrosas','No especificado'),
    extintores:v('n-extintores','No'),alarma:v('n-alarma','No'),
    botiquin:v('n-botiquin','No'),primeros_auxilios:v('n-primeros-auxilios','No'),hospital:v('n-hospital','No especificado'),
    tiene_riohs:v('n-tiene-riohs','No'),tiene_iper:v('n-tiene-iper','No'),
    capacitaciones:v('n-capacitaciones','No'),registro_epp:v('n-registro-epp','No'),
    accidentes:v('n-accidentes','Ninguno'),fiscalizacion:v('n-fiscalizacion','No'),
    riesgos:getRiesgos(),normativa:NORM[rub]||NORM['default'],
    sucursales:(typeof getSucursales==='function'?getSucursales():[]),
    sucursales_txt:(function(){
      var sucs=typeof getSucursales==='function'?getSucursales():[];
      if(!sucs.length) return '';
      return sucs.map(function(s){
        return s.nombre+': '+s.direccion+(s.superficie?' ('+s.superficie+'m²)':'')+(s.hospital?', hospital: '+s.hospital:'');
      }).join(' | ');
    })()
  });
  saveData();goTab('dash');
  setTimeout(function(){alert('Empresa guardada exitosamente.');},200);
});


// ── SEREMI POR REGIÓN ──
function getSEREMI(region) {
  var t = (region||'').toLowerCase().replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
  if(t.indexOf('arica')>=0) return 'SEREMI Salud Arica: 58 2 254 000';
  if(t.indexOf('tarapaca')>=0) return 'SEREMI Salud Tarapacá: 57 2 521 400';
  if(t.indexOf('antofagasta')>=0) return 'SEREMI Salud Antofagasta: 55 2 496 400';
  if(t.indexOf('atacama')>=0) return 'SEREMI Salud Atacama: 52 2 212 000';
  if(t.indexOf('coquimbo')>=0) return 'SEREMI Salud Coquimbo: 51 2 539 700';
  if(t.indexOf('valparaiso')>=0) return 'SEREMI Salud Valparaíso: 32 2 646 600';
  if(t.indexOf('metropolitana')>=0||t.indexOf('metro')>=0) return 'SEREMI Salud RM: 2 2 575 3000';
  if(t.indexOf('higgins')>=0||t.indexOf('ohiggins')>=0) return 'SEREMI Salud O\'Higgins: 72 2 328 400';
  if(t.indexOf('maule')>=0) return 'SEREMI Salud Maule: 71 2 241 700';
  if(t.indexOf('nuble')>=0) return 'SEREMI Salud Ñuble: 42 2 440 600';
  if(t.indexOf('biobio')>=0||t.indexOf('bio')>=0) return 'SEREMI Salud Biobío: 41 2 742 900';
  if(t.indexOf('araucania')>=0) return 'SEREMI Salud La Araucanía: 45 2 297 200';
  if(t.indexOf('rios')>=0||t.indexOf('rio')>=0) return 'SEREMI Salud Los Ríos: 63 2 247 100';
  if(t.indexOf('lagos')>=0) return 'SEREMI Salud Los Lagos: 65 2 482 900';
  if(t.indexOf('aysen')>=0) return 'SEREMI Salud Aysén: 67 2 234 900';
  if(t.indexOf('magallanes')>=0) return 'SEREMI Salud Magallanes: 61 2 207 500';
  return 'SEREMI Salud regional (consultar www.minsal.cl)';
}

// ── MUTUALIDAD TELÉFONOS ──
function getTelMutualidad(mut) {
  var m = (mut||'').toLowerCase();
  if(m.indexOf('achs')>=0) return 'ACHS 600 600 2247 (urgencias: 600 600 2247)';
  if(m.indexOf('ist')>=0) return 'IST 600 420 0000 (urgencias: 600 420 0000)';
  if(m.indexOf('mutual')>=0) return 'Mutual de Seguridad CChC 600 4700 000 (urgencias: 600 200 0101)';
  if(m.indexOf('ins')>=0||m.indexOf('normalizacion')>=0) return 'INS 600 5004 000';
  return (mut||'mutualidad')+' (consultar número)';
}

// ── GENERADOR ──
var gEmp=null,gTipo=null,gTexto='',tmrInt=null;

function initGen(){
  var sel=document.getElementById('g-emp');
  sel.innerHTML='<option value="">- Seleccionar -</option>';
  emps.forEach(function(e){
    var o=document.createElement('option');
    o.value=e.id;o.textContent=e.razon+' ('+e.rubro+')';sel.appendChild(o);
  });
  if(gEmp){sel.value=gEmp.id;onGEmpChange();}
  goStep(1);
}
function quickGen(empId){gEmp=emps.find(function(e){return e.id===empId;});goTab('generar');}

document.getElementById('g-emp').addEventListener('change',onGEmpChange);
function onGEmpChange(){
  var id=parseInt(document.getElementById('g-emp').value);
  var btn=document.getElementById('btn-gp1');
  var info=document.getElementById('g-emp-info');
  if(!id){btn.disabled=true;info.style.display='none';gEmp=null;return;}
  gEmp=emps.find(function(e){return e.id===id;});
  if(!gEmp)return;
  info.style.display='flex';
  info.innerHTML='<span>🏢</span><div><strong>'+gEmp.razon+'</strong><br><span style="font-size:10px;color:var(--muted)">'+gEmp.rubro+' . '+gEmp.trabajadores+' trab. . '+(gEmp.mutualidad||'-')+'</span></div>';
  btn.disabled=false;
}

document.getElementById('btn-gp1').addEventListener('click',function(){goStep(2);});

['riohs','iper','pts','emergencia','fuf','karin','capacitacion','derechosaber'].forEach(function(t){
  document.getElementById('tc-'+t).addEventListener('click',function(){
    document.querySelectorAll('.tipo-card').forEach(function(c){c.classList.remove('sel');});
    this.classList.add('sel');gTipo=t;
    document.getElementById('btn-gp2').disabled=false;
  });
});
document.getElementById('btn-gp2-back').addEventListener('click',function(){goStep(1);});
document.getElementById('btn-gp2').addEventListener('click',function(){goStep(3);});
document.getElementById('btn-gp3-back').addEventListener('click',function(){goStep(2);});
document.getElementById('btn-gp3').addEventListener('click',function(){goStep(4);});

function goStep(n){
  [1,2,3,4].forEach(function(i){
    document.getElementById('gp'+i).style.display=i===n?'block':'none';
    var gs=document.getElementById('gs'+i);
    gs.className='gs'+(i<n?' done':i===n?' active':'');
  });
  if(n===3)startGen();
  if(n===4)setupStep4();
  var sa=document.getElementById('scroll-area'); if(sa) sa.scrollTop=0;
}

// ── PROMPTS v2 — Fiscalizador Extremo Senior ──
function buildBase(e) {
  var hombres = (e.trabajadores||1) - (e.mujeres||0);
  // Variables dinámicas — deben estar aquí porque buildBase se llama antes de buildPrompt
  var veh_pesado = (e.trab_vehiculos||'').toLowerCase().indexOf('pesad') >= 0;
  var tiene_plaguicidas = (e.sustancias||'').toLowerCase().indexOf('plaguicida') >= 0 || (e.sustancias||'').toLowerCase().indexOf('herbicida') >= 0 || (e.sustancias||'').toLowerCase().indexOf('fungicida') >= 0 || (e.sustancias||'').toLowerCase().indexOf('agroquimico') >= 0;
  var tiene_uv = (e.radiacion||'').toLowerCase().indexOf('uv') >= 0 || (e.radiacion||'').toLowerCase().indexOf('solar') >= 0;
  return [
    '═══════════════ DATOS MAESTROS EMPRESA CLIENTE ═══════════════',
    'RAZÓN SOCIAL: '+e.razon,
    'RUT: '+e.rut,
    'DOMICILIO: '+(e.direccion||'')+', '+e.ciudad+', Región de '+e.region,
    'REP. LEGAL: '+(e.rep_nombre||'No especificado')+' | RUT: '+(e.rep_rut||'---')+' | Cargo: '+(e.rep_cargo||'Representante Legal'),
    (e.rep2_nombre?'REP. LEGAL 2: '+e.rep2_nombre+' | RUT: '+(e.rep2_rut||'---'):''),
    'MUTUALIDAD: '+(e.mutualidad||'No especificado'),
    'TELÉFONO: '+(e.telefono||'No especificado')+' | EMAIL: '+(e.email||'No especificado'),
    '',
    '═══════════════ ACTIVIDAD REAL ═══════════════',
    'RUBRO: '+e.rubro+(e.subrubro?' — '+e.subrubro:''),
    'ACTIVIDAD ESPECÍFICA: '+e.descripcion,
    'PRODUCTOS/SERVICIOS: '+(e.productos||'No especificado'),
    'LUGAR DE TRABAJO: '+(e.lugar_trabajo||'Instalaciones propias'),
    '',
    '═══════════════ DOTACIÓN DE PERSONAL ═══════════════',
    'TOTAL TRABAJADORES: '+e.trabajadores+' ('+hombres+' hombres, '+(e.mujeres||0)+' mujeres)',
    'CARGOS Y PUESTOS REALES: '+(e.cargos||'No especificado'),
    'TRABAJADORAS EMBARAZADAS/LACTANCIA: '+(e.embarazo||'No'),
    'TRABAJADORES MENORES DE 18: '+(e.menores||'No'),
    'TRABAJADORES CON DISCAPACIDAD: '+(e.discapacidad||'No'),
    'SINDICATO: '+(e.sindicato||'No'),
    '',
    '═══════════════ JORNADA LABORAL ═══════════════',
    'HORARIO: '+e.horario+' | TIPO: '+(e.jornada||'Ordinaria')+' | HORAS SEMANALES: '+(e.horas_semanales||'42')+' (máx. legal: 42 hrs desde 26-abr-2026, Ley 21.561)',
    'HORAS EXTRAORDINARIAS: '+(e.horas_extra||'No'),
    '',
    '═══════════════ INSTALACIONES ═══════════════',
    'SUPERFICIE: '+(e.superficie?e.superficie+'m²':'No especificado')+' | PISOS: '+(e.pisos||'1')+' | ATIENDE PÚBLICO: '+(e.publico||'No'),
    'MAQUINARIA Y EQUIPOS: '+(e.maquinaria||'No especificado'),
    '',
    '═══════════════ AGENTES DE RIESGO ═══════════════',
    'SUSTANCIAS QUÍMICAS: '+(e.sustancias||'Ninguna'),
    'EXPOSICIÓN RUIDO: '+(e.ruido||'No se sabe'),
    'POLVO: '+(e.polvo||'No'),
    'TEMPERATURA EXTREMA: '+(e.temperatura||'No'),
    'AGENTES BIOLÓGICOS: '+(e.biologico||'No'),
    'VIBRACIONES: '+(e.vibracion||'No'),
    'RADIACIÓN: '+(e.radiacion||'No'),
    '',
    '═══════════════ TRABAJOS DE ALTO RIESGO ═══════════════',
    'TRABAJO EN ALTURA: '+(e.trab_altura||'No'),
    'TRABAJO EN CALIENTE: '+(e.trab_caliente||'No'),
    'ESPACIOS CONFINADOS: '+(e.trab_confinado||'No'),
    'CONDUCCIÓN VEHÍCULOS: '+(e.trab_vehiculos||'No'),
    'EQUIPOS A PRESIÓN: '+(e.trab_presion||'No'),
    'TRABAJO NOCTURNO/AISLADO: '+(e.trab_nocturno||'No'),
    'OTRAS TAREAS PELIGROSAS: '+(e.tareas_peligrosas||'No especificado'),
    '',
    '═══════════════ RECURSOS DE EMERGENCIA ═══════════════',
    'EXTINTORES: '+(e.extintores||'No')+' | ALARMA: '+(e.alarma||'No'),
    'BOTIQUÍN: '+(e.botiquin||'No')+' | PRIMEROS AUXILIOS CAPACITADO: '+(e.primeros_auxilios||'No'),
    'CENTRO ASISTENCIAL MÁS CERCANO: '+(e.hospital||'No especificado'),
    '',
    '═══════════════ ESTADO CUMPLIMIENTO ACTUAL ═══════════════',
    'RIOHS VIGENTE: '+(e.tiene_riohs||'No')+' | IPER VIGENTE: '+(e.tiene_iper||'No'),
    'CAPACITACIONES: '+(e.capacitaciones||'No')+' | REGISTRO EPP: '+(e.registro_epp||'No'),
    'ACCIDENTES ÚLTIMOS 12 MESES: '+(e.accidentes||'Ninguno'),
    'FISCALIZACIONES DT/SEREMI: '+(e.fiscalizacion||'No'),
    (e.sucursales_txt?'\n═══════════════ SUCURSALES / SEDES ADICIONALES ═══════════════':''),
    (e.sucursales_txt?e.sucursales_txt:''),
    '═══════════════════════════════════════════════════════',
  (veh_pesado?'⚠️ ALERTA TRANSPORTE PESADO: Ley 18.290 licencia A2/A3, DS 72/2019 tacógrafo, DS 158/1980 carga por eje':''),
  (tiene_plaguicidas?'⚠️ ALERTA PLAGUICIDAS: DS 157/2005 MINSAL, DS 594 Art.103-107, Protocolo ERA, DS 57/2024 SGA, Autorización SAG':''),
  (tiene_uv?'⚠️ ALERTA UV SOLAR: Circular SUSESO Olas de Calor 2024 — protocolo exposición solar obligatorio':'')
  ].filter(Boolean).join('\n');
}

function buildPrompt(e,tipo,normas,rStr,fecha){
  var base = buildBase(e);
  var tipoBase=tipo.replace(/_p\d+$/,'').replace(/_/,'-').toUpperCase();
  var prefCliente=(e.razon||'DOC').replace(/[^A-Za-z0-9]/g,'').substring(0,8).toUpperCase();
  var ctrl = 'CÓDIGO: '+prefCliente+'-'+tipoBase+'-'+new Date().getFullYear()+' | VERSIÓN: 1.0 | FECHA: '+fecha+' | ELABORADO: Alan Bascur Montenegro, Ingeniero en Prevención de Riesgos, Plus Control SpA';
  var nt = e.trabajadores||1;
  var cphs_txt = nt>=25
    ? 'CPHS OBLIGATORIO (≥25 trabajadores DS 44/2024 Art.23): constituir 3 rep. empleador + 3 rep. trabajadores.'
    : nt>=10
      ? 'DELEGADO SST OBLIGATORIO (10-24 trabajadores DS 44/2024 Art.66): elegir por asamblea, acta, registrar DT.'
      : 'EMPRESA PEQUEÑA (<10 trabajadores): sin CPHS ni Delegado SST. Empleador asume funciones. Participación directa mediante asambleas mensuales.';

  var veh_pesado = (e.trab_vehiculos||'').toLowerCase().indexOf('pesad') >= 0;
  var tiene_forestal = (e.subrubro||'').toLowerCase().indexOf('madera')>=0||(e.subrubro||'').toLowerCase().indexOf('forestal')>=0||(e.descripcion||'').toLowerCase().indexOf('madera')>=0||(e.tareas_peligrosas||'').toLowerCase().indexOf('forestal')>=0;
  var tiene_plaguicidas = (e.sustancias||'').toLowerCase().indexOf('plaguicida') >= 0 || (e.sustancias||'').toLowerCase().indexOf('herbicida') >= 0 || (e.sustancias||'').toLowerCase().indexOf('fungicida') >= 0 || (e.sustancias||'').toLowerCase().indexOf('agroquimico') >= 0;
  var tiene_uv = (e.radiacion||'').toLowerCase().indexOf('uv') >= 0 || (e.radiacion||'').toLowerCase().indexOf('solar') >= 0;
  var I = [
    '⚠️ INSTRUCCIONES CRÍTICAS — LEE ANTES DE GENERAR:',
    '1. USA EXACTAMENTE los datos del cliente proporcionados arriba. NUNCA uses otros datos.',
    '2. Los riesgos, EPP y procedimientos deben corresponder a la actividad real: '+e.rubro+' / '+e.subrubro+'.',
    (e.sucursales_txt?'2b. EMPRESA CON MÚLTIPLES SEDES: '+e.sucursales_txt+'. El RIOHS Art.2 debe mencionar TODOS los domicilios. Plan de Emergencia y directorio diferenciados por sede con hospital específico de cada una.':''),
    '3. Cita solo artículos que existen en las normas mencionadas. NUNCA inventes artículos.',
    '4. CERO placeholders. Si un dato falta escribe "No especificado".',
    '5. Cada artículo mínimo 3 oraciones completas. NUNCA dejes artículos truncados.',
    '6. '+cphs_txt,
    (veh_pesado?'7. ⚠️ VEHÍCULOS PESADOS / MAQUINARIA AGRÍCOLA: CAMIONES en vía pública: Ley 18.290 (licencia A3 articulados, A2 rígidos), DS 72/2019 tacógrafo >3.500 kg, DS 298/1995 si lleva sustancias peligrosas. TRACTORES en predio: NO requieren licencia cuando operan DENTRO del fundo (Ley 18.290). Si sale a vía pública: licencia B mínima. PARA TODOS: DS 594 Art.79 protección PTO y partes móviles. Capacitación documentada operadores. PTS por tipo de maquinaria. Sin pasajeros en cabina no habilitada. Conductor itinerante: declarar en Art.2 RIOHS que vía pública e instalaciones de terceros son lugar de trabajo; CT Art.25 jornada choferes máx.10 hrs; DS 72/2019 tacógrafo; DS 44/2024 Arts.20-21 coordinación.':''),
    (tiene_plaguicidas?'8. ⚠️ PLAGUICIDAS/AGROQUÍMICOS: DS 157/2005 MINSAL, DS 594 Arts.103-107, Protocolo ERA, fichas SGA DS 57/2024. EPP BODEGUERO: respirador OV/P100, guantes nitrilo/neopreno, delantal impermeable, careta facial. EPP VENDEDOR/A: guantes nitrilo desechables. ALMACENAMIENTO: bodega separada, ventilación DS 594 Art.39, piso impermeable, contención derrames, señalética, inventario. TRANSPORTE: DS 298/1995 documento sustancias peligrosas, etiqueta clase ONU, cartilla QAP en cabina, extintor ABC.':''),
    (parseInt((e.hospital||'0').replace(/[^0-9]/g,''))||0)>=20 || (e.hospital||'').match(/\b(2[0-9]|3[0-9]|[4-9][0-9]|\d{3}) ?km/) ?
      '9. ⚠️ HOSPITAL LEJANO (>20 km): botiquín nivel AVANZADO (vendaje hemostático, collar cervical, camilla rígida) en CADA sede. Persona capacitada primeros auxilios POR TURNO incluido nocturno. Vehículo designado evacuación con llaves disponibles. Coordinar con SAMU 131 protocolo rural.' : '',
    (tiene_uv?'10. ⚠️ RADIACIÓN UV SOLAR: Circular SUSESO Olas de Calor 2024, protector solar FPS 50+, manga larga, evitar 11:00-15:00 en verano.':''),
    (e.trab_nocturno&&e.trab_nocturno!=='No'?'11. ⚠️ TRABAJO NOCTURNO (CT Art.10, 21:00-06:00): CT Art.28 descanso mínimo 9 hrs CONTINUAS entre jornadas; iluminación DS 594 Art.103 mín.150 lux; evaluación psicosocial CEAL-SM-SUSESO jornada nocturna; prohibir maquinaria pesada con fatiga; primeros auxilios en turno nocturno.':''),
    (e.sucursales_txt?'12. ⚠️ TRABAJO EN SOLITARIO (DS 594 Art.53): si alguna sede tiene 1 solo trabajador (independiente del género), incluir protocolo verificación telefónica mínimo cada 2 hrs, alerta ante no respuesta, contacto emergencia designado.':''),
    (tiene_forestal?'13. ⚠️ EXTRACCIÓN DE MADERAS: DS 4/2013 CONAF (incendios forestales), NCh 2904 (trabajos forestales), EPP motosierra (casco forestal, pantalón anticorte, botas forestales, guantes anticorte), PTS específico de motosierra y apeo de árboles.':''),
    ((e.biologico||'').toLowerCase().indexOf('animal')>=0?'14. ⚠️ MANEJO DE ANIMALES/ZOONOSIS: Protocolo ERA biológicos, riesgo brucelosis y leptospirosis para lecheros/ternereros. EPP: guantes nitrilo/goma, botas impermeables, ropa protectora. Nunca solo con toro adulto. Lavado de manos obligatorio.':''),
    ''
  ].filter(function(x){return x!=='';}).join('\n');

  if(tipo==='riohs_p1a') return I+'\nElabora RIOHS PARTE 1 (Caps. I-III) para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAP.I PREÁMBULO, VIGENCIA Y POLÍTICA SST:\n'+
    '- Art.1 Fundamento legal completo: DS 44/2024, Ley 16.744, CT Arts.153-157 y 184, Ley 21.643, DS 2/2024.\n'+
    '- Art.2 Ámbito de aplicación: todos los trabajadores, contratistas, visitas. Dotación: '+e.trabajadores+' trabajadores ('+e.cargos+'). Domicilio: '+e.direccion+', '+e.ciudad+'. Horario: '+e.horario+' = '+e.horas_semanales+' hrs/semana (máx. legal 42 hrs Ley 21.561).\n'+
    '- Art.3 Vigencia y revisión anual.\n'+
    '- Art.4 Política SST firmada: compromiso dirección, objetivos medibles 2026-2027, responsabilidades.\n'+
    '- Art.5 Difusión y entrega gratuita (CT Art.156).\n\n'+
    'CAP.II DEFINICIONES (DS 44/2024 + Ley 21.643): mínimo 20 definiciones completas. OBLIGATORIAS: acoso laboral (UNA SOLA VEZ O reiterada Ley 21.643 Art.2), acoso sexual (CT Art.2 inc.2), violencia en el trabajo, peligro (DS 44/2024 Art.4 N°12), riesgo (Art.4 N°19), lugar de trabajo (Art.4 N°9), medida de control (Art.4 N°10), MIPER, OAL, EPP, incidente, accidente del trabajo (Ley 16.744 Art.5), enfermedad profesional (Ley 16.744 Art.7), perspectiva de género, Delegado SST, CPHS, Derecho a Saber.\n\n'+
    'CAP.III ADMISIÓN Y CONTRATACIÓN: exámenes según cargo y riesgo (no exigibles como condición CT Art.2), inducción SST mínimo 2 hrs primer día, entrega RIOHS + MIPER + PTS, firma acuse recibo, Derecho a Saber (DS 44/2024 Art.14-15).\n\nAl terminar escribe exactamente: ===P1aFIN===';

  if(tipo==='riohs_p1b') return I+'\nElabora RIOHS PARTE 2 (Caps. IV-VI) para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAP.IV JORNADA LABORAL (CT Art.22, Ley 21.561):\n'+
    '- Jornada ordinaria: '+e.horario+' = '+e.horas_semanales+' hrs/semana. Colación mínima 30 min (CT Art.34) NO imputable a jornada.\n'+
    '- Jornada máxima legal vigente desde 26-abr-2026: 42 hrs/semana (Ley 21.561/2023). Próxima reducción: 40 hrs en abr-2028.\n'+
    '- Horas extraordinarias: máx. 2 hrs/día, pacto escrito CT Art.32, recargo 50%.\n'+
    '- '+cphs_txt+'\n'+
    '- Trabajo nocturno, feriados, descanso dominical y semanal según CT.\n\n'+
    'CAP.V OBLIGACIONES DEL EMPLEADOR (CT Art.184, DS 44/2024):\n'+
    '- Proporcionar EPP gratuitos certificados ISP.\n'+
    '- Elaborar y mantener MIPER actualizada (DS 44/2024 Art.7).\n'+
    '- Capacitar mínimo 8 hrs anuales con enfoque género (DS 44/2024 Art.16).\n'+
    '- Investigar accidentes e incidentes.\n'+
    '- Informar riesgos (Derecho a Saber DS 44/2024 Art.14-15).\n'+
    '- Mantener registros documentales disponibles para DT y Mutual.\n'+
    '- Implementar Protocolo Ley Karin.\n\n'+
    'CAP.VI RIESGOS ESPECÍFICOS DEL RUBRO '+e.rubro+' — '+e.subrubro+':\n'+
    '- Mínimo 12 peligros REALES de la actividad con sus medidas de control específicas.\n'+
    '- Riesgos físicos, químicos, ergonómicos, de seguridad y psicosociales del rubro.\n'+
    '- Agentes específicos: '+e.sustancias+'.\n'+
    '- Maquinaria: '+e.maquinaria+'.\n\nAl terminar escribe exactamente: ===P1bFIN===';

  if(tipo==='riohs_p2a') return I+'\nElabora RIOHS PARTE 3 (Caps. VII-IX) para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAP.VII OBLIGACIONES DE LOS TRABAJADORES (DS 44/2024 Art.5, CT Art.184):\n'+
    'Mínimo 15 artículos numerados, específicos para '+e.rubro+'. Incluir obligatoriamente: uso EPP, reporte condiciones inseguras, asistencia capacitaciones, participación simulacros, cumplimiento PTS, prohibición alcohol/drogas, orden y aseo, cuidado herramientas y vehículos, reporte accidentes, participación asambleas mensuales.\n\n'+
    'CAP.VIII PROHIBICIONES (CT Art.154 bis, DS 44/2024):\n'+
    'Mínimo 12 prohibiciones concretas para '+e.rubro+'. Incluir: alcohol/drogas en trabajo, fumar en zonas de riesgo, desactivar dispositivos seguridad, uso EPP ajeno, modificar equipos sin autorización, transporte personas no autorizadas, uso celular conducción, fotografiar instalaciones sin autorización, otras específicas del rubro.\n\n'+
    'CAP.IX DERECHO A SABER (DS 44/2024 Art.14-15):\n'+
    'Tabla por cada cargo real ('+e.cargos+'). Columnas: Cargo | Tarea | Riesgo | Medida preventiva | EPP obligatorio | Normativa. Mínimo 3 filas por cargo. Formato tabla markdown. Al final: protocolo entrega, firma trabajador, actualización ante cambios.\n\nAl terminar escribe exactamente: ===P2aFIN===';

  if(tipo==='riohs_p2b') return I+'\nElabora RIOHS PARTE 4 (Caps. X-XII) para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAP.X EQUIPOS DE PROTECCIÓN PERSONAL (DS 44/2024 Art.13, Ley 16.744 Art.68):\n'+
    'Tabla por cargo: Cargo | EPP | Norma NCh | Certificación ISP | Cuándo usar | Responsable entrega. Incluir todos los cargos ('+e.cargos+'). EPP específicos para '+e.rubro+'. Procedimiento entrega, reposición, registro.\n\n'+
    'CAP.XI ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES (Ley 16.744):\n'+
    '- Definiciones: accidente del trabajo (Art.5), accidente de trayecto (Art.5 inc.2), enfermedad profesional (Art.7).\n'+
    '- Procedimiento ante accidente: primeros auxilios → SAMU 131 → DIAT ante mutualidad dentro de 24 horas siguientes (Ley 16.744 Art.76) → investigación OAL.\n'+
    '- Accidente de trayecto: trabajador presenta personalmente DIAT ante mutual.\n'+
    '- Investigación interna: metodología árbol de causas, medidas correctivas, plazos.\n'+
    '- Estadísticas de accidentabilidad.\n\n'+
    'CAP.XII RIESGOS PSICOSOCIALES (DS 44/2024, Protocolo CEAL-SM-SUSESO):\n'+
    '- Evaluación CEAL-SM-SUSESO: dimensiones, frecuencia (cada 2 años mínimo), medidas organizacionales.\n'+
    '- NOTA: El Protocolo Ley Karin completo (canales denuncia, plazos, investigación) está en Cap.XX.\n'+
    '- Protocolo alcohol y drogas: prohibición DS 44/2024 Art.9, indicios razonables, test por profesional de salud acreditado, cadena de custodia, segunda muestra, consecuencias.\n\nAl terminar escribe exactamente: ===P2bFIN===';

  if(tipo==='riohs_p3') return I+'\nElabora RIOHS 2025 PARTE 3 (Caps. XIII-XVII) para el siguiente cliente:\n\n'+base+'\n\n'+cphs_txt+' Fecha: '+fecha+'.\n\n'+
    'CAP.XIII REPRESENTACIÓN PREVENTIVA: '+cphs_txt+' Desarrollo completo según corresponda al tamaño de la empresa.\n\n'+
    'CAP.XIV GESTIÓN PREVENTIVA: MIPER (metodología PxC 1-5, enfoque género, revisión anual), Programa Trabajo Preventivo (30 días desde MIPER), capacitación 8 hrs enfoque género DS 44/2024 Art.16, evaluación anual programa, vigilancia ambiental y salud.\n\n'+
    'CAP.XV ORDEN, HIGIENE Y CONDICIONES SANITARIAS (DS 594/1999): condiciones específicas para '+e.rubro+'. Servicios higiénicos segun DS 594 Art.25-28 para '+e.trabajadores+' trabajadores ('+(e.mujeres||0)+' mujeres). Agua, comedor, vestuarios. Iluminación, ventilación, temperatura. Almacenamiento de: '+e.sustancias+'. Manipulación manual de carga (Ley 20.949/2016, DS 63/2005 MINTRAB — límites Ley 20.949/2016: 25 kg hombre adulto, 15 kg mujer adulta (en condiciones ideales de levantamiento — reducir ante postura, frecuencia o distancia)).\n\n'+
    'CAP.XVI EMERGENCIAS Y EVACUACIÓN (DS 594 Art.44-54, DS 44/2024 Art.19): escenarios específicos para '+e.rubro+'/'+e.subrubro+'. Roles proporcionales a '+e.trabajadores+' trabajadores. Extintores: '+e.extintores+'. Alarma: '+e.alarma+'. Botiquín: '+e.botiquin+'. Simulacros: mínimo 1 anual obligatorio (DS 44/2024 Art.19), se recomienda 2 por año. Directorio: Bomberos 132, SAMU 131, Carabineros 133, SENAPRED 1424, '+getTelMutualidad(e.mutualidad)+', '+getSEREMI(e.region)+', hospital: '+(e.hospital||'más cercano')+'.\n\n'+
    'CAP.XVII INVESTIGACIÓN DE ACCIDENTES (DS 44/2024 y Ley 16.744 Art.76): metodología OAL enfoque género, plazos (DIAT ante la mutualidad dentro de las 24 horas siguientes al accidente (Ley 16.744 Art.76)), informe accidente, medidas correctivas, comunicación trabajadores. Estadísticas: tasa accidentabilidad, frecuencia, gravedad, diferenciadas por género.\n\nAl terminar escribe exactamente: ===P3FIN===';

  if(tipo==='riohs_p4a') return I+'\nElabora RIOHS 2025 PARTE 4 (Caps. XVIII-XIX) para el siguiente cliente:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+'CAP.XVIII INFRACCIONES Y SANCIONES (CT Art.154 N°7 (sanciones RIOHS) y CT Art.157 (destino multas)):\nDesarrollar con artículos numerados completos:\nArt.1 Fundamento legal y ámbito de aplicación.\nArt.2 Clasificación detallada: infracciones LEVES con mínimo 6 ejemplos específicos del rubro '+e.rubro+'; infracciones GRAVES con mínimo 6 ejemplos específicos; infracciones GRAVÍSIMAS con mínimo 6 ejemplos específicos.\nArt.3 Escala de sanciones completa: amonestación verbal (primera vez infracción leve) → amonestación escrita (segunda vez) → multa máx.25% remuneración diaria (CT Art.154 N°7) → término contrato Art.160 N°1 CT. Destino multas: fondos bienestar personal (CT Art.157).\nArt.4 Procedimiento sancionatorio con 7 fases: constatación 24 hrs → comunicación 3 días hábiles → descargos 5 días hábiles → investigación complementaria → resolución 10 días hábiles → notificación → registro.\nArt.5 Circunstancias atenuantes (mínimo 5 ejemplos).\nArt.6 Circunstancias agravantes (mínimo 5 ejemplos).\nArt.7 Non bis in idem: prohibición de doble sanción por mismo hecho.\nArt.8 Prescripción: leves 6 meses, graves y gravísimas 12 meses.\nArt.9 Registro Centralizado de Sanciones: libro físico foliado, datos mínimos que debe contener.\nArt.10 INFRACCIÓN LEY 21.561: trabajar sobre 42 hrs/semana sin pacto escrito CT Art.32 = infracción grave (multa CT Art.506).\n\nCAP.XIX CANALES DE DENUNCIA Y RECLAMO:\nArt.11 Canales internos: superior jerárquico, correo '+(e.email||'(ver datos empresa)')+'  o comunicación verbal directa al representante legal.\nArt.12 Canal DT externo: dt.gob.cl, tel. 600 4500 247, oficina DT Región de '+e.region+'.\nArt.13 Canal SUSESO (600 4200 400) y SEREMI Salud '+getSEREMI(e.region)+'.\nArt.14 Plazos: acuse recibo interno 2 días hábiles; resolución interna 30 días hábiles.\nArt.15 Protección del denunciante: confidencialidad, prohibición represalias, no puede ser despedido sin autorización DT.\n\nAl terminar escribe exactamente: ===P4aFIN===\n';

  if(tipo==='riohs_p4b') return I+'\nElabora RIOHS 2025 PARTE 5 — FINAL (Caps. XX-XXII) para el siguiente cliente:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+'CAP.XX PROTOCOLO PREVENCIÓN Y SANCIÓN VIOLENCIA LABORAL — LEY KARIN (Ley 21.643 + DS 2/2024):\nDesarrollar COMPLETAMENTE con artículos numerados. NO resumir. Cada artículo mínimo 3 oraciones.\nArt.16 Ámbito: aplica a '+e.razon+', incluye conductas entre trabajadores y de clientes/proveedores/público hacia trabajadores.\nArt.17 Definición ACOSO LABORAL: conducta que constituya agresión u hostigamiento (puede ser una sola vez, Ley 21.643 Art.2), que menoscabe, maltrate o humille al trabajador.\nArt.18 Definición ACOSO SEXUAL: requerimiento sexual no consentido (CT Art.2 inc.2) que amenace situación laboral.\nArt.19 Definición VIOLENCIA EN EL TRABAJO: ejercicio de fuerza física o psicológica con resultado de daño.\nArt.20 Medidas preventivas: capacitación anual obligatoria (DS 44/2024 Art.16), evaluación clima laboral CEAL-SM-SUSESO, difusión trimestral.\nArt.21 Responsable nominado de recibir denuncias: '+e.rep_nombre+', '+e.rep_cargo+' | correo: '+(e.email||'(ver correo empresa en datos de contacto)')+'. Este nombre debe aparecer textualmente.\nArt.22 Procedimiento denuncia: formulario escrito o verbal → acuse recibo 2 días hábiles → medidas cautelares DENTRO DE 5 DÍAS HÁBILES (separación física obligatoria, redistribución tareas).\nArt.23 Investigación interna: investigador imparcial designado en 3 días hábiles. Para empresas <10 trabajadores, el empleador PUEDE derivar la investigación directamente a la Inspección del Trabajo. Informe con conclusiones DENTRO DE 30 DÍAS HÁBILES.\nArt.24 Sanciones al infractor: escala amonestación → multa → término contrato Art.160 N°1 CT letra f).\nArt.25 Protección denunciante: confidencialidad, no represalias, no despido sin autorización DT durante investigación.\nArt.26 Canal externo: Inspección del Trabajo (dt.gob.cl / 600 4500 247). Plazo: 90 días CORRIDOS desde hecho.\nArt.27 Registro libro denuncias reservado, estadísticas anuales.\n\nPROTOCOLO ALCOHOL Y DROGAS (DS 44/2024 Art.9):\nArt.28 Prohibición absoluta con base legal (DS 44/2024 Art.9 y CT Art.184).\nArt.29 Indicios razonables que habilitan el test: aliento alcohólico, conducta alterada, coordinación deteriorada, ojos enrojecidos, habla incoherente.\nArt.30 Procedimiento test: aplicado por profesional de salud o institución acreditada; cadena de custodia; derecho trabajador a solicitar segunda muestra.\nArt.31 Consecuencias positivo: suspensión inmediata, proceso disciplinario, causal Art.160 N°1 CT en reiteración.\nArt.32 Consecuencias negativa: se considera positivo según criterio DT.\n\nCAP.XXI DISPOSICIONES FINALES:\nArt.33 Este RIOHS entra en vigencia el '+fecha+' y se revisará anualmente.\nArt.34 Distribución gratuita: copia a cada trabajador con acuse de recibo firmado.\nArt.35 Ingreso portal DT dentro de 15 días hábiles desde aprobación (CT Art.156).\nArt.36 Modificaciones: comunicar 30 días anticipación, aprobación previa Inspección DT.\n\nCAP.XXII CONTROL DOCUMENTAL Y FIRMAS:\n'+ctrl+'\n\nAUTORIZACIÓN Y FIRMA DEL DOCUMENTO:\n\nElaborado por:\nAlan Bascur Montenegro\nIngeniero en Prevención de Riesgos | Plus Control SpA\nLastarrias 602, Osorno, Los Lagos\n\nAprobado por:\n'+e.rep_nombre+'\n'+e.rep_cargo+'\nRUT: '+e.rep_rut+'\n'+e.razon+(e.rep2_nombre?'\n\nFirma y timbre: '+e.rep2_nombre+' (Representante Legal) | RUT: '+(e.rep2_rut||'---')+'.':'')+'\n\nFecha: '+fecha+'.';

  if(tipo==='iper_p1') return I+'\nElabora MATRIZ IPER DS 44/2024 PARTE 1 para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    'ENCABEZADO FORMAL completo con datos del cliente arriba.\n\n'+
    'METODOLOGÍA P×C CON ENFOQUE DE GÉNERO (DS 44/2024 Art.7):\n'+
    'Probabilidad 1-5: 1=Muy poco probable, 2=Poco probable, 3=Posible, 4=Probable, 5=Muy probable.\n'+
    'Consecuencia 1-5: 1=Insignificante, 2=Menor, 3=Moderado (tratamiento médico), 4=Mayor (incapacidad parcial), 5=Catastrófico (muerte).\n'+
    'Clasificación: Trivial(1-4), Tolerable(5-8), Moderado(9-16), Importante(17-24), Intolerable(25).\n\n'+
    'TABLA MIPER — primera mitad de puestos/procesos de '+e.rubro+'/'+e.subrubro+':\n'+
    'Columnas: N°|Área/Proceso|Puesto de Trabajo|Tarea específica|Peligro REAL del rubro|Tipo peligro|Causa raíz|Consecuencia potencial|N° trab. expuestos (máx. '+e.trabajadores+')|Género expuesto|P|C|P×C|Nivel riesgo|Normativa aplicable|Control eliminación|Control ingeniería|Control administrativo|EPP con norma NCh.\n'+
    'Mínimo 15 registros con peligros REALES de: '+e.subrubro+'. '+
    (e.mujeres>0?'PERSPECTIVA DE GÉNERO OBLIGATORIA: generar filas específicas para los '+e.mujeres+' cargos femeninos con análisis diferencial de: exposición a plaguicidas (límites menores), carga manual (15 kg máx.), riesgo violencia/acoso de clientes (Ley Karin), ergonomía de pie (TMERT). ':'')+
    'Incluir: '+e.sustancias+', altura='+e.trab_altura+', caliente='+e.trab_caliente+', confinado='+e.trab_confinado+', presión='+e.trab_presion+'.\n\nAl terminar escribe exactamente: ===IPER1FIN===';

  if(tipo==='iper_p2') return I+'\nElabora MATRIZ IPER DS 44/2024 PARTE 2 para el siguiente cliente:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'SEGUNDA MITAD: mismas columnas, mínimo 15 registros adicionales. OBLIGATORIO incluir: riesgos ergonómicos (MMC Ley 20.949/2016 + DS 63/2005, posturas forzadas, TMERT Res.327/2024), riesgos psicosociales (CEAL-SM-SUSESO), exposición a '+e.sustancias+', ruido='+e.ruido+', polvo='+e.polvo+', temperatura='+e.temperatura+', biológico='+e.biologico+'.\n\n'+
    'TABLA RIESGOS PSICOSOCIALES: instrumento '+(e.mutualidad||'mutualidad')+' / CEAL-SM-SUSESO. Dimensiones, nivel riesgo, medidas organizacionales.\n\n'+
    'PLAN DE ACCIÓN — riesgos Importantes e Intolerables:\n'+
    'Columnas: N°|Peligro|Nivel|Medida correctiva específica|Responsable (cargo real)|Plazo días hábiles|Recurso|Indicador cumplimiento|Fecha seguimiento|Estado.\n\n'+
    'PROGRAMA ANUAL PREVENTIVO '+new Date().getFullYear()+': mes|actividad|responsable|participantes|duración|indicador.\n\n'+
    'FIRMAS: Alan Bascur Montenegro IPR Plus Control SpA | '+(e.rep_nombre||'Rep.Legal')+' '+e.rep_cargo+' | Fecha próxima revisión.';

  if(tipo==='pts') return I+'\nElabora PROCEDIMIENTO DE TRABAJO SEGURO (PTS) para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+'⚠️ NOTA: Si el campo OTRAS TAREAS PELIGROSAS contiene múltiples tareas, elabora PTS para la PRIMERA tarea listada y al final incluye una sección "OTROS PTS REQUERIDOS" listando cada tarea adicional que requiere su propio PTS según DS 44/2024 Art.8.\n\n'+
    'Identifica la tarea más crítica de '+e.rubro+'/'+e.subrubro+' considerando: '+(e.tareas_peligrosas||'Tareas propias del rubro '+e.rubro)+', altura='+e.trab_altura+', caliente='+e.trab_caliente+', confinado='+e.trab_confinado+', presión='+e.trab_presion+', vehículos='+e.trab_vehiculos+'.\n\n'+
    '1. IDENTIFICACIÓN: nombre del PTS, código, fecha.\n'+
    '2. OBJETO Y ALCANCE: tarea específica, personal al que aplica (cargos: '+(e.cargos||'Ver ficha de cargos de la empresa')+').\n'+
    '3. NORMATIVA: '+normas+', DS 63/2005, DS 594/1999, normas NCh aplicables.\n'+
    '4. DEFINICIONES técnicas específicas de la tarea.\n'+
    '5. RESPONSABILIDADES: trabajador, supervisor, empleador.\n'+
    '6. PELIGROS tabla: peligro|consecuencia|nivel riesgo PxC|control.\n'+
    '7. EPP OBLIGATORIO tabla: cargo|EPP|norma NCh|certificación ISP|cuándo.\n'+
    '8. PREPARACIÓN: mínimo 5 pasos verificación previa.\n'+
    '9. PROCEDIMIENTO PASO A PASO — mínimo 15 pasos numerados:\n'+
    '   N°|Descripción detallada|Peligro del paso|Medida control específica|Responsable|Punto crítico S/N.\n'+
    '10. RESTRICCIONES Y STOP WORK: condiciones que detienen el trabajo.\n'+
    '11. EMERGENCIAS: accidente con herido (primeros auxilios→SAMU 131), incendio (Bomberos 132), '+(e.trab_presion!=='No'?'fuga/explosión presión, ':'')+(e.sustancias!=='Ninguna'?'derrame '+e.sustancias+', ':'')+'.\n'+
    '12. PROTOCOLO ALCOHOL Y DROGAS (DS 44/2024 Art.9): prohibición, procedimiento ante sospecha.\n'+
    '13. REGISTROS: acuse recibo firma trabajadores, checklist previo, registro incidentes.\n'+
    '14. ACTUALIZACIÓN: ante accidente, cambio proceso, o anualmente.';

  if(tipo==='fuf'){
    var p1 = I+'\nElabora FUF DS 44/2024 PARTE 1 (ítems 1-28) para:\n\n'+base+'\n\n'+
      'Para cada ítem marca CUMPLE / NO CUMPLE / NO APLICA según realidad real del cliente.\n'+
      'Justifica cada NO CUMPLE con infracción y artículo vulnerado.\n'+
      'NO APLICA con razón breve.\n'+
      (nt<10?'EMPRESA <10 TRABAJADORES: CPHS y Delegado SST NO APLICAN. Indicar correctamente.':nt<25?'EMPRESA 10-24 TRABAJADORES: Delegado SST APLICA, CPHS NO APLICA.':'EMPRESA ≥25 TRABAJADORES: CPHS APLICA.')+'\n\n'+
      'SECCIÓN 1 SGSST (Art.22,64): Ítem1 política SST con estructura y mejora continua.\n'+
      'SECCIÓN 2 MIPER (Art.7): Ítems 2-7: MIPER todos procesos, riesgos psicosociales/género, disponibilidad, peligros/evaluación/controles, revisión anual, autoevaluación OAL.\n'+
      'SECCIÓN 3 PROGRAMA (Art.8-19): Ítems 8-28: programa preventivo escrito y aprobado, medidas control, EPP (sin costo, certificado ISP, capacitación), información y formación (8 hrs género), participación, RGI, plan emergencia, pruebas anuales.\n\nAl terminar: ===FUF_P1FIN===';
    var p2 = I+'\nFUF DS 44/2024 PARTE 2 (ítems 29-60 + Resumen Ejecutivo) para el siguiente cliente:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
      'SECCIÓN 7 COORDINACIÓN (DS 44/2024 Art.20): Ítem 29: Cuando '+e.razon+' trabaja en instalaciones de clientes, verificar si existe acuerdo de coordinación con la empresa principal y si se informaron los riesgos mutuamente.\n'+'SECCIÓN 8 CPHS/DELEGADO (Art.23-66): Ítems 30-40 según tamaño real: '+nt+' trabajadores. '+cphs_txt+'\n'+
      'SECCIÓN 9 DPR (Art.50-65): Ítems 41-48: '+(nt>100?'DPR OBLIGATORIO':'No aplica por '+nt+' trabajadores.')+'\n'+
      'SECCIÓN 10 RIOHS (Art.56-58): Ítems 49-52: vigente, distribuido, revisado, contenido completo.\n'+
      'SECCIÓN 11 MAPAS RIESGO (Art.62): Ítem 53.\n'+
      'SECCIONES 12-14 (DS 44/2024 Título V — vigilancia de la salud y ambiente, investigación accidentes): Ítems 54-60: vigilancia ambiental/salud, investigación accidentes con enfoque género, documentación disponible para fiscalizadores.\n\n'+
      'RESUMEN EJECUTIVO:\n'+
      '- CONTEO: Cumple X / No Cumple X / No Aplica X\n'+
      '- NIVEL RIESGO LEGAL: ALTO(>10 NC) / MEDIO(5-10 NC) / BAJO(<5 NC)\n'+
      '- MULTAS ESTIMADAS EN UTM según DS 44/2024\n'+
      '- TOP 5 INCUMPLIMIENTOS CRÍTICOS con plazo recomendado\n'+
      '- PLAN DE ACCIÓN INMEDIATA\n'+
      'Elaborado: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';
    return p1+'\n\n===FUF_INTERMEDIO===\n\n'+p2;
  }

  if(tipo==='karin') return I+'\nElabora PROTOCOLO COMPLETO LEY KARIN (Ley 21.643 + DS 2/2024 MINTRAB) para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    '## PROTOCOLO DE PREVENCIÓN Y SANCIÓN DE VIOLENCIA LABORAL\n'+
    '### Ley 21.643 vigente desde agosto 2024 + DS 2/2024 MINTRAB\n\n'+
    'Art.1 ÁMBITO: aplica a toda relación laboral de '+e.razon+', entre trabajadores, con clientes, proveedores y público.\n'+
    'Art.2 DEFINICIONES LEGALES PRECISAS: acoso laboral (Ley 21.643 Art.2: agresión u hostigamiento, una sola vez O reiterada), acoso sexual (requerimiento sexual no consentido), violencia en el trabajo (física/psicológica/sexual), violencia por razón de género.\n'+
    'Art.3 MEDIDAS PREVENTIVAS: identificación factores riesgo, capacitación anual (incluir en programa '+new Date().getFullYear()+'), evaluación clima laboral.\n'+
    'Art.4 CANAL DENUNCIA INTERNO: el responsable NOMINADO para recibir denuncias es '+e.rep_nombre+', '+e.rep_cargo+' (este nombre debe aparecer textualmente en el documento, conforme Ley 21.643). Formulario escrito o verbal. Plazo acuse recibo: 2 días hábiles.\n'+
    'Art.5 MEDIDAS CAUTELARES INMEDIATAS (máx. 5 días desde denuncia): separación física, redistribución horaria, otras medidas según caso.\n'+
    'Art.6 PROCEDIMIENTO INVESTIGACIÓN: designación investigador imparcial (3 días). IMPORTANTE: En empresas con menos de 10 trabajadores, si no es posible garantizar imparcialidad interna, el empleador DEBE derivar la investigación directamente a la Inspección del Trabajo (Ley 21.643), evitando conflicto de interés. Comunicación a denunciado, descargos y pruebas, informe con conclusiones y medidas (máx. 30 días hábiles).\n'+
    'Art.7 SANCIONES AL INFRACTOR: amonestación escrita → multa hasta 25% remuneración diaria → término contrato Art.160 N°1 CT.\n'+
    'Art.8 PROTECCIÓN DENUNCIANTE: confidencialidad, prohibición absoluta de represalias, no puede ser despedido durante investigación sin autorización DT.\n'+
    'Art.9 CANAL EXTERNO: Inspección del Trabajo (dt.gob.cl / 600 4500 247 / Oficina DT Región de '+e.region+'). Plazo denuncia: 90 días CORRIDOS (calendarios) desde ocurrencia del hecho.\n'+
    'Art.10 REGISTRO: libro de denuncias reservado, estadísticas anuales, reporte a mutualidad.\n'+
    'Firma: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';

  if(tipo==='capacitacion') return I+'\nElabora PROGRAMA DE CAPACITACIÓN ANUAL EN SST para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    'FUNDAMENTO LEGAL: DS 44/2024 Art.16 (mínimo 8 horas anuales, enfoque género obligatorio).\n\n'+
    'DIAGNÓSTICO DE NECESIDADES: basado en riesgos identificados de '+e.rubro+'/'+e.subrubro+', accidentes: '+(e.accidentes||'Ninguno')+', cumplimiento actual: capacitaciones: '+(e.capacitaciones||'Ninguna registrada')+'.\n\n'+
    'PROGRAMA ANUAL '+new Date().getFullYear()+' — tabla:\n'+
    'N°|Módulo|Contenido específico del rubro|Horas|Mes|Responsable|Participantes (cargos)|Metodología|Indicador|Estado.\n\n'+
    'MÓDULOS OBLIGATORIOS (mínimo 8):\n'+
    '1. Inducción SST y RIOHS (obligatorio nuevos trabajadores).\n'+
    '2. Riesgos específicos de '+e.subrubro+' y medidas control.\n'+
    '3. Uso correcto de EPP específico del rubro.\n'+
    '4. Primeros auxilios básicos y RCP (mínimo 4 hrs — DS 44/2024 Art.16).\n'+
    '5. Manejo manual de cargas (Ley 20.949/2016, DS 63/2005 MINTRAB).\n'+
    '6. Prevención de riesgos psicosociales y Ley Karin (Ley 21.643).\n'+
    '7. Plan de emergencia y evacuación — simulacros.\n'+
    '8. Perspectiva de género en SST (DS 44/2024 enfoque género).\n'+'9. Ley 21.561 — Nueva jornada laboral 42 hrs (vigente 26-abr-2026): derechos de los trabajadores, reducción progresiva hasta 40 hrs en 2028, pacto de horas extras, consecuencias de infracción (CT Art.22 y Art.506).\n'+
    (e.trab_altura!=='No'?'10. Trabajo en altura seguro (DS 594/1999, NCh 1357).\n':'')+
    (e.sustancias!=='Ninguna'?'11. Manejo seguro de '+e.sustancias+' (NCh 382, DS 57/2024 MINSAL SGA).\n':'')+
    '\nREGISTROS: lista de asistencia firmada por capacitado, evaluación comprensión, certificado participación.\n'+
    'Firma: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';

  if(tipo==='derechosaber') return I+'\nElabora DOCUMENTO DERECHO A SABER (DS 44/2024 Art.14-15) para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    'FUNDAMENTO: DS 44/2024 Art.14: el empleador debe informar a cada trabajador antes de iniciar labores sobre los riesgos específicos de su puesto.\n\n'+
    'TABLA DERECHO A SABER — una fila por cargo real (cargos: '+(e.cargos||'Ver ficha de cargos de la empresa')+'):\n'+
    'Columnas: Cargo/Puesto|Tarea específica|Peligro real del rubro|Tipo peligro (físico/químico/biológico/ergonómico/psicosocial/mecánico)|Agente causal|Vía exposición|Consecuencia potencial|Probabilidad (1-5)|Consecuencia (1-5)|P×C|Nivel riesgo|Medida prevención|EPP obligatorio con norma NCh|Normativa aplicable.\n\n'+
    'Mínimo 10 registros con datos REALES de '+e.subrubro+'.\n\n'+
    'FORMULARIO DE ACUSE DE RECIBO (para firma de cada trabajador):\n'+
    '- Nombre completo, RUT, cargo, fecha inicio labores.\n'+
    '- Declaración de haber recibido información sobre riesgos de su puesto.\n'+
    '- Declaración de haber recibido capacitación en uso de EPP.\n'+
    '- Espacio para firma trabajador y firma empleador '+e.rep_nombre+'.\n\n'+
    'Firma: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';

  // Plan de Emergencia
  return I+'\nElabora PLAN DE EMERGENCIA Y EVACUACIÓN para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    '1. Objetivo, alcance, vigencia.\n'+
    '2. Descripción instalaciones: '+e.superficie+'m², '+e.pisos+' piso(s), atiende público: '+e.publico+'.\n'+
    '3. ESCENARIOS DE EMERGENCIA ESPECÍFICOS para '+e.rubro+'/'+e.subrubro+': NO solo incendio genérico. '+
    (e.alarma==='No' && tiene_plaguicidas?'ATENCIÓN: sin sistema de alarma y con almacenamiento de sustancias inflamables/tóxicas, incluir MEDIDAS COMPENSATORIAS OBLIGATORIAS: (1) detector de humo autónomo en bodega de plaguicidas; (2) extintor ABC a máx. 15 m de bodega; (3) prohibición fumar y fuentes de ignición en radio 10 m; (4) revisión visual bodega al inicio y cierre de jornada; (5) cartilla emergencia química visible en bodega; (6) rondas inspección cada 2 hrs; (7) protocolo verificación telefónica para trabajadora sola en sucursal. ':'')+
    'Incluir: '+
      (e.trab_presion!=='No'?'explosión/fuga equipo a presión, ':'')+
      (e.sustancias!=='Ninguna'?'derrame/intoxicación '+e.sustancias+', ':'')+
      (e.trab_confinado!=='No'?'accidente en espacio confinado, ':'')+
      (e.trab_vehiculos!=='No'?'accidente de tránsito con carga, ':'')+
      'incendio, accidente grave, sismo.\n'+
    '4. ORGANIGRAMA proporcional a '+e.trabajadores+' personas: cargos reales: '+(e.cargos||'Ver ficha de cargos de la empresa')+'.\n'+
    '5. PROTOCOLOS DETALLADOS: procedimiento paso a paso para cada escenario.\n'+
    '6. VÍAS EVACUACIÓN y punto de encuentro.\n'+
    '7. RECURSOS: extintores '+e.extintores+', alarma '+e.alarma+', botiquín '+e.botiquin+', persona primeros auxilios: '+e.primeros_auxilios+'.\n'+
    '8. DIRECTORIO DE EMERGENCIAS (Bomberos 132 | SAMU 131 | Carabineros 133 | SENAPRED 1424): '+
    (e.sucursales_txt?'Generar tabla DIFERENCIADA por sede con hospital específico de cada una. '+e.sucursales_txt:' Hospital: '+(e.hospital||'más cercano'))+
    ' | '+getTelMutualidad(e.mutualidad)+' | '+getSEREMI(e.region)+'.'+'\n'+
    '9. SIMULACROS: mínimo 1 anual obligatorio (DS 44/2024 Art.19), se recomienda 2 anuales; registrar participantes, fecha, evaluación y acciones de mejora.\n'+
    '10. Normativa: DS 594/1999 Art.44-54, NCh 934 Of.2008, DS 44/2024 Art.19.\n'+
    '11. Firma: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';
}

async function callClaude(prompt, intentos, onChunk){
  intentos = intentos||0;
  return new Promise(function(resolve, reject){
    var fullText = '';
    var ctrl = new AbortController();
    var tmt = setTimeout(function(){ ctrl.abort(); }, 300000);

    fetch('/api/claude', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prompt:prompt}),
      signal:ctrl.signal
    }).then(function(res){
      if(!res.ok){
        clearTimeout(tmt);
        if(intentos<2){
          setTimeout(function(){
            callClaude(prompt,intentos+1,onChunk).then(resolve).catch(reject);
          },5000);
        } else {
          reject(new Error('Servidor no disponible ('+res.status+'). Espere 30s e intente de nuevo.'));
        }
        return;
      }
      var reader=res.body.getReader();
      var decoder=new TextDecoder();
      var buf='';
      function leer(){
        reader.read().then(function(result){
          if(result.done){
            clearTimeout(tmt);
            if(fullText) resolve(fullText);
            else reject(new Error('Sin contenido. Intente nuevamente.'));
            return;
          }
          buf+=decoder.decode(result.value,{stream:true});
          var lines=buf.split('\n');
          buf=lines.pop();
          for(var i=0;i<lines.length;i++){
            var line=lines[i];
            if(!line.startsWith('data: ')) continue;
            try{
              var obj=JSON.parse(line.slice(6));
              if(obj.chunk){
                fullText+=obj.chunk;
                if(onChunk) onChunk(obj.chunk); // ← streaming en pantalla
              }
              if(obj.error){
                clearTimeout(tmt);
                if(intentos<2&&(obj.error.includes('overload')||obj.error.includes('529'))){
                  setTimeout(function(){callClaude(prompt,intentos+1,onChunk).then(resolve).catch(reject);},8000);
                } else {
                  reject(new Error(obj.error));
                }
                return;
              }
              if(obj.done){
                clearTimeout(tmt);
                if(fullText) resolve(fullText);
                else reject(new Error('Respuesta vacía. Intente nuevamente.'));
                return;
              }
            }catch(e){}
          }
          leer();
        }).catch(function(err){
          clearTimeout(tmt);
          if(err.name==='AbortError'){
            reject(new Error('Tiempo de espera agotado. Intente nuevamente.'));
          } else if(intentos<2){
            setTimeout(function(){callClaude(prompt,intentos+1,onChunk).then(resolve).catch(reject);},3000);
          } else {
            reject(new Error(err.message||'Error de conexión. Intente nuevamente.'));
          }
        });
      }
      leer();
    }).catch(function(err){
      clearTimeout(tmt);
      if(err.name==='AbortError'){
        reject(new Error('Tiempo de espera agotado. Intente nuevamente.'));
      } else if(intentos<2){
        setTimeout(function(){callClaude(prompt,intentos+1,onChunk).then(resolve).catch(reject);},5000);
      } else {
        reject(new Error('Error de red. Verifique su conexión e intente nuevamente.'));
      }
    });
  });
}

async function startGen(){
  if(!gEmp||!gTipo)return;
  var e=gEmp;
  var out=document.getElementById('ai-out');
  var lbl=document.getElementById('ai-lbl');
  var btn=document.getElementById('btn-gp3');
  var acts=document.getElementById('gp3-acts');
  gTexto='';btn.disabled=true;acts.style.display='none';

  // Área de streaming — muestra texto en tiempo real
  out.innerHTML='<div id="stream-box" style="font-family:Georgia,serif;font-size:11px;line-height:1.7;color:var(--txt);white-space:pre-wrap;padding:10px;min-height:60px"></div>';
  lbl.textContent='Claude · Generando '+TIPO_N[gTipo]+'...';
  document.getElementById('ai-pulse').classList.add('live');
  var s=0;clearInterval(tmrInt);
  tmrInt=setInterval(function(){s++;document.getElementById('ai-tmr').textContent=pad(Math.floor(s/60))+':'+pad(s%60);},1000);

  var normas=(e.normativa||NORM['default']).join(', ');
  var rStr=(e.riesgos||[]).map(function(r){return '- '+r.nombre+' (P:'+r.prob+',C:'+r.cons+')';}).join('\n')||'No especificados';
  var fecha=new Date().toLocaleDateString('es-CL');

  // Función que agrega chunk al display en tiempo real
  var streamBox=document.getElementById('stream-box');
  var acumulado='';
  function onChunk(txt){
    acumulado+=txt;
    streamBox.textContent=acumulado; // texto plano en tiempo real
    streamBox.scrollTop=streamBox.scrollHeight; // auto-scroll
  }

  // Función para separar partes acumuladas con banner de progreso
  function bannerParte(msg){
    acumulado+='\n\n';
    streamBox.textContent=acumulado;
    lbl.textContent=msg;
  }

  try {
    var texto='';
    if(gTipo==='riohs'){
      lbl.textContent='Claude · Parte 1/8 — Preámbulo y Definiciones...';
      var p1a=await callClaude(buildPrompt(e,'riohs_p1a',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 2/8 — Jornada y Riesgos del Rubro...');
      var p1b=await callClaude(buildPrompt(e,'riohs_p1b',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 3/8 — Obligaciones y Derecho a Saber...');
      var p2a=await callClaude(buildPrompt(e,'riohs_p2a',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 4/8 — EPP, Accidentes y Psicosocial...');
      var p2b=await callClaude(buildPrompt(e,'riohs_p2b',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 5/8 — Representación y Gestión Preventiva...');
      var p3=await callClaude(buildPrompt(e,'riohs_p3',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 6/8 — Infracciones y Sanciones...');
      var p4a=await callClaude(buildPrompt(e,'riohs_p4a',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 7/8 — Protocolo Ley Karin...');
      var p4b=await callClaude(buildPrompt(e,'riohs_p4b',normas,rStr,fecha),0,onChunk);
      texto=p1a.replace('===P1aFIN===','').trim()+'\n\n'+
            p1b.replace('===P1bFIN===','').trim()+'\n\n'+
            p2a.replace('===P2aFIN===','').trim()+'\n\n'+
            p2b.replace('===P2bFIN===','').trim()+'\n\n'+
            p3.replace('===P3FIN===','').trim()+'\n\n'+
            p4a.replace('===P4aFIN===','').trim()+'\n\n'+
            p4b;
    } else if(gTipo==='iper'){
      lbl.textContent='Claude · IPER Parte 1/2...';
      var ip1=await callClaude(buildPrompt(e,'iper_p1',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · IPER Parte 2/2 — Plan de acción...');
      var ip2=await callClaude(buildPrompt(e,'iper_p2',normas,rStr,fecha),0,onChunk);
      texto=ip1.replace('===IPER1FIN===','').trim()+'\n\n'+ip2;
    } else if(gTipo==='fuf'){
      lbl.textContent='Claude · FUF Parte 1/2 — Ítems 1-28...';
      var fuf_prompt=buildPrompt(e,'fuf',normas,rStr,fecha);
      var parts_fuf=fuf_prompt.split('===FUF_INTERMEDIO===');
      var fp1=await callClaude(parts_fuf[0].trim(),0,onChunk);
      bannerParte('Claude · FUF Parte 2/2 — Ítems 29-60 + Resumen...');
      var fp2=await callClaude(parts_fuf[1].trim(),0,onChunk);
      texto=fp1.replace('===FUF_P1FIN===','').trim()+'\n\n'+fp2;
    } else {
      lbl.textContent='Claude · Generando '+TIPO_N[gTipo]+'...';
      texto=await callClaude(buildPrompt(e,gTipo,normas,rStr,fecha),0,onChunk);
    }

    // Documento completo — renderizar con markdown
    clearInterval(tmrInt);
    gTexto=texto;
    out.innerHTML=md2html(gTexto);
    lbl.textContent='✅ '+TIPO_N[gTipo]+' — Listo';
    document.getElementById('ai-pulse').classList.remove('live');
    acts.style.display='block';
    btn.disabled=false;

  } catch(err){
    clearInterval(tmrInt);
    document.getElementById('ai-pulse').classList.remove('live');
    var consejo='<br><br><span style="color:#888;font-size:10px">Si es la primera generación del día, espere 30 segundos e intente nuevamente.</span>';
    out.innerHTML='<div style="color:var(--rojo2);padding:10px;font-size:12px">'+err.message+consejo+'</div>';
    lbl.textContent='❌ Error';
    acts.style.display='block';
    btn.disabled=false;
  }
}

function setupStep4(){
  document.getElementById('doc-prev').innerHTML=md2html(gTexto);
  document.getElementById('normas-chk').innerHTML=(gEmp.normativa||NORM['default']).slice(0,8).map(function(n){return '<span class="norma-pill">✓ '+n+'</span>';}).join('');
  document.getElementById('firma-pend').style.display='block';
  document.getElementById('firma-sent').style.display='none';
}

document.getElementById('btn-dl-txt').addEventListener('click',function(){
  var b=new Blob([gTexto],{type:'text/plain;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(b);
  a.download='PlusControl_'+gTipo+'_'+(gEmp.razon||'doc').replace(/\s+/g,'_')+'.txt';
  a.click();
});

document.getElementById('btn-pdf').addEventListener('click',generarPDF);

document.getElementById('btn-enviar-alan').addEventListener('click',function(){
  docs.push({
    id:Date.now(),empresa_id:gEmp.id,empresa_nombre:gEmp.razon,
    tipo:gTipo,tipo_nombre:TIPO_N[gTipo],rubro:gEmp.rubro,
    texto:gTexto,estado:'pendiente',fecha:new Date().toLocaleDateString('es-CL')
  });
  saveData();
  document.getElementById('firma-pend').style.display='none';
  document.getElementById('firma-sent').style.display='block';
  renderDash();
});

// ── PDF PROFESIONAL ──
function generarPDF(){
  if(!gTexto||!gEmp)return;
  var fecha=new Date().toLocaleDateString('es-CL');
  var fechaLarga=new Date().toLocaleDateString('es-CL',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  var tipo=TIPO_N[gTipo]||gTipo;
  var docId='PC-'+Date.now().toString(36).toUpperCase();
  var normasList=(gEmp.normativa||NORM['default']).join(' . ');
  var firmado=docs.find(function(d){return d.empresa_id===gEmp.id&&d.tipo===gTipo&&d.estado==='firmado';});

  // ── Parser markdown → HTML con soporte completo de tablas ──
  function parseMd(txt){
    if(!txt)return '';
    var lines=txt.split('\n'),out=[],i=0;
    while(i<lines.length){
      var line=lines[i];
      // Tabla markdown: |col|col| seguido de |---|---|
      if(/^\|.+\|/.test(line)&&i+1<lines.length&&/^\|[\s\-:|]+\|/.test(lines[i+1])){
        var headers=line.split('|').filter(function(c,j,a){return j>0&&j<a.length-1;}).map(function(c){return c.trim();});
        i+=2;
        var th='<table class="tbl"><thead><tr>';
        headers.forEach(function(h){th+='<th class="th">'+h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</th>';});
        th+='</tr></thead><tbody>';
        while(i<lines.length&&/^\|.+\|/.test(lines[i])){
          var cells=lines[i].split('|').filter(function(c,j,a){return j>0&&j<a.length-1;}).map(function(c){return c.trim();});
          th+='<tr>';
          cells.forEach(function(c){th+='<td class="td">'+c.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</td>';});
          th+='</tr>';
          i++;
        }
        th+='</tbody></table>';
        out.push(th);
        continue;
      }
      if(/^#### /.test(line)){out.push('<h4 class="h4">'+line.slice(5)+'</h4>');i++;continue;}
      if(/^### /.test(line)){out.push('<h3 class="h3">'+line.slice(4)+'</h3>');i++;continue;}
      if(/^## /.test(line)){out.push('<h2 class="h2">'+line.slice(3)+'</h2>');i++;continue;}
      if(/^# /.test(line)){out.push('<h1 class="h1">'+line.slice(2)+'</h1>');i++;continue;}
      if(/^[\*\-] /.test(line)){out.push('<li>'+line.slice(2).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</li>');i++;continue;}
      if(line.trim()===''){out.push('<br>');i++;continue;}
      out.push('<p class="p">'+line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</p>');
      i++;
    }
    return out.join('\n');
  }
  var cuerpo=parseMd(gTexto||'');

  var firmadoHtml=firmado?'<div style="color:#3d7a35;font-weight:700;font-size:9pt;margin-top:6pt;font-family:Arial,sans-serif">✓ Firmado digitalmente el '+firmado.fecha+'</div>':'';

  var CSS=
    '@page{size:A4;margin:0;}'+
    '*{margin:0;padding:0;box-sizing:border-box;}'+
    'html{font-size:10.5pt;}'+
    'body{font-family:Georgia,"Times New Roman",serif;color:#1a1a1a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'+
    // Portada
    '.portada{width:21cm;min-height:29.7cm;display:flex;flex-direction:column;page-break-after:always;}'+
    '.bt{background:#0d0d10;height:2.2cm;display:flex;align-items:center;padding:0 2cm;}'+
    '.btlogo{font-family:Arial,sans-serif;font-size:22pt;font-weight:900;color:#fff;letter-spacing:-.02em;}'+
    '.btlogo span{color:#6ec462;}'+
    '.btsub{font-family:Arial,sans-serif;font-size:7pt;color:#888;letter-spacing:.22em;text-transform:uppercase;margin-left:14pt;padding-left:14pt;border-left:1px solid #333;}'+
    '.bv{background:#3d7a35;height:4pt;}'+
    '.pb{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:1.5cm 2cm;text-align:center;}'+
    '.badge{font-family:Arial,sans-serif;font-size:8pt;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#3d7a35;border:1.5px solid #3d7a35;padding:5pt 16pt;border-radius:2pt;margin-bottom:28pt;}'+
    '.ptitle{font-family:Georgia,serif;font-size:24pt;font-weight:700;color:#0d0d10;line-height:1.2;margin-bottom:8pt;text-transform:uppercase;letter-spacing:.04em;}'+
    '.psub{font-family:Georgia,serif;font-size:13pt;color:#555;font-style:italic;margin-bottom:36pt;}'+
    '.pdiv{width:80pt;height:2pt;background:#3d7a35;margin:0 auto 36pt;}'+
    '.pemp{background:#f8f8f6;border:1px solid #ddd;border-left:4pt solid #3d7a35;padding:18pt 28pt;text-align:left;width:100%;max-width:14cm;}'+
    '.penombre{font-family:Arial,sans-serif;font-size:14pt;font-weight:700;color:#0d0d10;margin-bottom:6pt;}'+
    '.pedato{font-family:Arial,sans-serif;font-size:9pt;color:#555;line-height:1.7;}'+
    '.pedato strong{color:#1a1a1a;font-weight:700;}'+
    '.pfooter{padding:0 2cm 1.5cm;display:flex;justify-content:space-between;align-items:flex-end;}'+
    '.pfizq{font-family:Arial,sans-serif;font-size:8pt;color:#888;line-height:1.6;}'+
    '.pfder{font-family:"Courier New",monospace;font-size:8pt;color:#bbb;text-align:right;}'+
    '.bb{background:#0d0d10;height:1.2cm;}'+
    // Pagina interna
    '.pag{width:21cm;min-height:29.7cm;padding:1.8cm 2cm 2.5cm;position:relative;page-break-after:always;}'+
    '.pag:last-child{page-break-after:auto;}'+
    '.pghd{display:flex;justify-content:space-between;align-items:center;padding-bottom:8pt;border-bottom:.5pt solid #ccc;margin-bottom:20pt;}'+
    '.pglogo{font-family:Arial,sans-serif;font-size:10pt;font-weight:900;color:#0d0d10;}'+
    '.pglogo span{color:#3d7a35;}'+
    '.pgdoc{font-family:Arial,sans-serif;font-size:7.5pt;color:#888;text-align:right;line-height:1.5;}'+
    '.pgft{position:absolute;bottom:1cm;left:2cm;right:2cm;display:flex;justify-content:space-between;padding-top:6pt;border-top:.5pt solid #e0e0e0;font-family:Arial,sans-serif;font-size:7pt;color:#aaa;}'+
    // Tipografia
    '.h1{font-family:Arial,sans-serif;font-size:13pt;font-weight:700;color:#fff;background:#0d0d10;padding:8pt 14pt;margin:20pt 0 10pt;text-transform:uppercase;letter-spacing:.06em;page-break-after:avoid;}'+
    '.h2{font-family:Arial,sans-serif;font-size:11.5pt;font-weight:700;color:#0d0d10;border-bottom:1.5pt solid #3d7a35;padding-bottom:3pt;margin:16pt 0 8pt;text-transform:uppercase;letter-spacing:.04em;page-break-after:avoid;}'+
    '.h3{font-family:Arial,sans-serif;font-size:10.5pt;font-weight:700;color:#2a5a24;margin:12pt 0 5pt;page-break-after:avoid;}'+
    '.h4{font-family:Arial,sans-serif;font-size:10pt;font-weight:700;color:#444;margin:8pt 0 4pt;}'+
    '.p{font-size:10.5pt;color:#1a1a1a;margin-bottom:6pt;text-align:justify;}'+
    'li{font-size:10.5pt;color:#1a1a1a;margin-bottom:4pt;padding-left:14pt;position:relative;text-align:justify;}'+
    'li::before{content:"▸";color:#3d7a35;position:absolute;left:0;font-size:8pt;top:2pt;}'+
    'strong{font-weight:700;color:#0d0d10;}'+
    // Firma
    '.fsec{page-break-before:always;padding:1.8cm 2cm;}'+
    '.ftitle{font-family:Arial,sans-serif;font-size:12pt;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d0d10;margin-bottom:4pt;}'+
    '.fsub{font-family:Arial,sans-serif;font-size:9pt;color:#777;margin-bottom:30pt;}'+
    '.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:3cm;margin-bottom:36pt;}'+
    '.fcol{text-align:center;}'+
    '.fesp{height:3.5cm;border-bottom:1pt solid #333;margin-bottom:22pt;position:relative;}'+
    '.fesplbl{position:absolute;bottom:-17pt;left:50%;transform:translateX(-50%);font-family:Arial,sans-serif;font-size:7pt;color:#aaa;white-space:nowrap;font-style:italic;}'+
    '.fnombre{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;color:#0d0d10;margin-bottom:3pt;}'+
    '.fcargo{font-family:Arial,sans-serif;font-size:9pt;color:#555;line-height:1.5;margin-bottom:2pt;}'+
    '.frut{font-family:"Courier New",monospace;font-size:9pt;color:#777;margin-bottom:2pt;}'+
    '.forg{font-family:Arial,sans-serif;font-size:9pt;font-weight:700;color:#3d7a35;}'+
    // Sello
    '.swrap{display:flex;justify-content:center;margin:16pt 0 28pt;}'+
    '.sello{border:2pt solid #0d0d10;border-radius:50%;width:4.5cm;height:4.5cm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;}'+
    '.sello::before{content:"";position:absolute;inset:4pt;border:1pt solid #3d7a35;border-radius:50%;}'+
    '.stop{font-family:Arial,sans-serif;font-size:6.5pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#0d0d10;margin-bottom:4pt;}'+
    '.smain{font-family:Arial,sans-serif;font-size:12pt;font-weight:900;color:#0d0d10;line-height:1.1;}'+
    '.smain span{color:#3d7a35;}'+
    '.sbot{font-family:Arial,sans-serif;font-size:6pt;color:#666;letter-spacing:.08em;margin-top:4pt;}'+
    // Nota legal
    '.nota{background:#f8f8f6;border:1pt solid #ddd;border-left:3pt solid #3d7a35;padding:12pt 16pt;font-family:Arial,sans-serif;font-size:8.5pt;color:#555;line-height:1.6;margin-top:18pt;}'+
    '.nota strong{color:#1a1a1a;}'+
    '.ffooter{margin-top:16pt;padding-top:8pt;border-top:.5pt solid #e0e0e0;display:flex;justify-content:space-between;font-family:Arial,sans-serif;font-size:7.5pt;color:#aaa;}'+
    // Tablas
    '.tbl{width:100%;border-collapse:collapse;margin:10pt 0 14pt;font-family:Arial,sans-serif;font-size:8.5pt;page-break-inside:avoid;}'+
    '.th{background:#0d0d10;color:#fff;font-weight:700;padding:5pt 7pt;text-align:left;border:1pt solid #333;font-size:8pt;letter-spacing:.02em;}'+
    '.td{padding:4pt 7pt;border:1pt solid #ddd;color:#1a1a1a;vertical-align:top;line-height:1.4;}'+
    'tr:nth-child(even) .td{background:#f8f8f6;}'+
    'tr:hover .td{background:#f0f7ef;}';

  var portada=
    '<div class="portada">'+
    '<div class="bt"><div class="btlogo">Plus<span>Control</span></div><div class="btsub">Prevención Integral de Riesgos</div></div>'+
    '<div class="bv"></div>'+
    '<div class="pb">'+
    '<div class="badge">Documento Oficial de Prevencion de Riesgos &nbsp;.&nbsp; Plus Control SpA</div>'+
    '<div class="ptitle">'+tipo+'</div>'+
    '<div class="psub">Normativa Chilena Vigente '+new Date().getFullYear()+'</div>'+
    '<div class="pdiv"></div>'+
    '<div class="pemp">'+
    '<div class="penombre">'+gEmp.razon+'</div>'+
    '<div class="pedato">'+
    '<strong>RUT:</strong> '+(gEmp.rut||'-')+'<br>'+
    '<strong>Rubro:</strong> '+gEmp.rubro+(gEmp.subrubro?' / '+gEmp.subrubro:'')+'<br>'+
    '<strong>Dirección:</strong> '+(gEmp.direccion||'')+', '+gEmp.ciudad+', Región de '+gEmp.region+'<br>'+
    '<strong>Representante Legal:</strong> '+(gEmp.rep_nombre||'-')+(gEmp.rep_cargo?' - '+gEmp.rep_cargo:'')+'<br>'+
    '<strong>N° Trabajadores:</strong> '+gEmp.trabajadores+' &nbsp;|&nbsp; <strong>Mutualidad:</strong> '+(gEmp.mutualidad||'-')+
    '</div></div></div>'+
    '<div class="pfooter">'+
    '<div class="pfizq">Elaborado por:<br><strong style="color:#1a1a1a">Alan Bascur Montenegro</strong><br>Ingeniero en Prevención de Riesgos<br>Prevencionista de Riesgos Profesionales<br>Plus Control SpA &nbsp;.&nbsp; Osorno, Los Lagos, Chile</div>'+
    '<div class="pfder">Fecha: '+fechaLarga+'<br>Codigo: '+docId+'<br>Version: 1.0</div>'+
    '</div>'+
    '<div class="bb"></div>'+
    '</div>';

  var pagCuerpo=
    '<div class="pag">'+
    '<div class="pghd"><div class="pglogo">Plus<span>Control</span></div><div class="pgdoc">'+tipo+'<br>'+gEmp.razon+' &nbsp;.&nbsp; '+fecha+'</div></div>'+
    '<div>'+cuerpo+'</div>'+
    '<div class="pgft"><span>Plus Control SpA &nbsp;.&nbsp; Prevención Integral de Riesgos &nbsp;.&nbsp; Osorno, Chile</span><span>'+docId+' &nbsp;.&nbsp; '+fecha+'</span></div>'+
    '</div>';

  var pagFirma=
    '<div class="fsec">'+
    '<div class="pghd"><div class="pglogo">Plus<span>Control</span></div><div class="pgdoc">'+tipo+' &nbsp;.&nbsp; '+gEmp.razon+'</div></div>'+
    '<div class="ftitle">Autorización y Firma del Documento</div>'+
    '<div class="fsub">Documento elaborado conforme a normativa chilena vigente. Queda sujeto a la aprobación de los firmantes.</div>'+
    '<div class="fgrid" style="grid-template-columns:'+(gEmp.rep2_nombre?'1fr 1fr 1fr':'1fr 1fr')+';">'+
    '<div class="fcol">'+
    '<div class="fesp"><div class="fesplbl">Firma y Timbre</div></div>'+
    '<div class="fnombre">Alan Bascur Montenegro</div>'+
    '<div class="fcargo">Ingeniero en Prevención de Riesgos<br>Prevencionista de Riesgos Profesionales</div>'+
    '<div class="frut">RUT: 17.658.387-8</div>'+
    '<div class="forg">Plus Control SpA &nbsp;.&nbsp; Osorno, Los Lagos</div>'+
    firmadoHtml+
    '</div>'+
    '<div class="fcol">'+
    '<div class="fesp"><div class="fesplbl">Firma y Timbre</div></div>'+
    '<div class="fnombre">'+(gEmp.rep_nombre||'Representante Legal')+'</div>'+
    '<div class="fcargo">'+(gEmp.rep_cargo||'Representante Legal')+'</div>'+
    '<div class="frut">RUT: '+(gEmp.rep_rut||'___________________')+'</div>'+
    '<div class="forg">'+gEmp.razon+'</div>'+
    '</div>'+
    (gEmp.rep2_nombre?'<div class="fcol"><div class="fesp"><div class="fesplbl">Firma y Timbre</div></div><div class="fnombre">'+gEmp.rep2_nombre+'</div><div class="fcargo">Representante Legal</div><div class="frut">RUT: '+(gEmp.rep2_rut||'___________________')+'</div><div class="forg">'+gEmp.razon+'</div></div>':'')+
    '</div>'+
    '<div class="swrap"><div class="sello"><div class="stop">Plus</div><div class="smain">C<span>+</span></div><div class="sbot">Osorno . Chile</div></div></div>'+
    '<div class="nota">'+
    '<strong>Nota Legal:</strong> Elaborado conforme al <strong>Decreto Supremo N° 44/2024 MINTRAB</strong> (vigente desde 01-feb-2025, reemplaza DS 40/1969 y DS 54/1969), <strong>Ley N° 16.744</strong>, <strong>DS 594/1999 MINSAL</strong>, <strong>Ley 21.643 Ley Karin</strong> (vigente agosto 2024) y normativa especifica del rubro <strong>'+gEmp.rubro+'</strong>. '+
    'Debe ser entregado gratuitamente a cada trabajador, exhibido en lugares visibles del establecimiento y comunicado a la Dirección del Trabajo conforme al art. 156 del Código del Trabajo. '+
    'La entidad empleadora <strong>'+gEmp.razon+'</strong> es responsable de su implementación y cumplimiento.<br><br>'+
    '<strong>Normativa de referencia:</strong> '+normasList+
    '</div>'+
    '<div class="ffooter"><span>Plus Control SpA &nbsp;.&nbsp; Prevención Integral de Riesgos &nbsp;.&nbsp; Osorno, Los Lagos, Chile</span><span>Cod: '+docId+' &nbsp;.&nbsp; '+fecha+'</span></div>'+
    '</div>';

  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>'+tipo+' - '+gEmp.razon+'</title><style>'+CSS+'</style></head><body>'+portada+pagCuerpo+pagFirma+'<script>window.onload=function(){setTimeout(function(){window.print();},900);}<\/script></body></html>';

  var win=window.open('','_blank');
  win.document.write(html);
  win.document.close();
}

// ── ALAN ──
function renderAlan(){
  var pend=docs.filter(function(d){return d.estado==='pendiente';}).length;
  document.getElementById('alan-pend').textContent=pend;
  var badge=document.getElementById('badge-alan');
  badge.textContent=pend;badge.style.display=pend>0?'flex':'none';
  var list=document.getElementById('alan-list');
  var empty=document.getElementById('alan-empty');
  if(!docs.length){list.innerHTML='';list.style.display='none';empty.style.display='block';return;}
  list.style.display='block';empty.style.display='none';
  list.innerHTML=docs.map(function(d){
    var ico=d.tipo==='riohs'?'📋':d.tipo==='iper'?'⚠️':d.tipo==='pts'?'📝':'🚨';
    return '<div class="card-item" data-id="'+d.id+'"><div class="ci-ico">'+ico+'</div><div class="ci-body"><div class="ci-title">'+d.empresa_nombre+'</div><div class="ci-sub">'+d.tipo_nombre.split('(')[0].trim()+' . '+d.fecha+'</div></div><div class="ci-right"><span class="tag '+(d.estado==='firmado'?'tag-ok':'tag-wait')+'">'+(d.estado==='firmado'?'✅ Firmado':'⏳ Pendiente')+'</span><span class="ci-arr">></span></div></div>';
  }).join('');
  list.querySelectorAll('.card-item').forEach(function(el){
    el.addEventListener('click',function(){showDocSheet(parseInt(this.dataset.id));});
  });
}
function showDocSheet(id){
  var d=docs.find(function(x){return x.id===id;}); if(!d)return;
  var e=emps.find(function(x){return x.id===d.empresa_id;});
  document.getElementById('sheet-title').textContent=d.tipo_nombre.split('(')[0].trim();
  var btnFirma=d.estado==='pendiente'
    ? '<button class="btn btn-primary" id="s-firma">✍ Firmar y aprobar documento</button>'
    : '<div class="firma-ok" style="justify-content:center;display:flex;width:100%">✅ Firmado el '+d.fecha+'</div>';
  document.getElementById('sheet-body').innerHTML=
    '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">'+d.empresa_nombre+' . '+d.rubro+'<br>'+d.fecha+'</div>'+
    '<div style="background:var(--bg4);border-radius:10px;padding:14px;max-height:200px;overflow-y:auto;font-size:11px;line-height:1.7;margin-bottom:14px" class="doc-content">'+md2html((d.texto||'').substring(0,1500)+'...')+'</div>'+
    '<button class="btn btn-ghost" id="s-pdf" style="margin-bottom:8px">📄 Ver PDF completo</button>'+
    btnFirma;
  if(document.getElementById('s-firma')){
    document.getElementById('s-firma').addEventListener('click',function(){firmar(id);});
  }
  document.getElementById('s-pdf').addEventListener('click',function(){
    if(e){gEmp=e;gTipo=d.tipo;gTexto=d.texto;}
    generarPDF();
  });
  openSheet();
}
function firmar(id){
  var d=docs.find(function(x){return x.id===id;}); if(!d)return;
  d.estado='firmado';d.fecha=new Date().toLocaleDateString('es-CL');
  saveData();closeSheet();renderAlan();renderDash();
  setTimeout(function(){alert('Documento firmado y aprobado por Alan Bascur Montenegro.');},200);
}

// ── SHEET ──
function openSheet(){
  document.getElementById('sheet-overlay').classList.add('open');
  document.getElementById('sheet').style.display='block';
}
function closeSheet(){
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('sheet').style.display='none';
}
document.getElementById('sheet-overlay').addEventListener('click',closeSheet);

// ── UTILS ──
function pad(n){return String(n).padStart(2,'0');}
function md2html(txt){
  if(!txt)return '';
  var lines=txt.split('\n'),out=[],i=0;
  while(i<lines.length){
    var line=lines[i];
    if(/^\|.+\|/.test(line)&&i+1<lines.length&&/^\|[\s\-:|]+\|/.test(lines[i+1])){
      var headers=line.split('|').filter(function(c,j,a){return j>0&&j<a.length-1;}).map(function(c){return c.trim();});
      i+=2;
      var th='<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:11px"><thead><tr>';
      headers.forEach(function(h){th+='<th style="background:#0d0d10;color:#fff;padding:4px 6px;text-align:left;border:1px solid #333;font-size:10px">'+h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</th>';});
      th+='</tr></thead><tbody>';
      while(i<lines.length&&/^\|.+\|/.test(lines[i])){
        var cells=lines[i].split('|').filter(function(c,j,a){return j>0&&j<a.length-1;}).map(function(c){return c.trim();});
        th+='<tr>';
        cells.forEach(function(c){th+='<td style="padding:3px 6px;border:1px solid #ddd;font-size:10px">'+c.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</td>';});
        th+='</tr>';
        i++;
      }
      th+='</tbody></table>';
      out.push(th); continue;
    }
    if(/^# /.test(line)){out.push('<strong style="font-size:14px;display:block;margin:8px 0 4px">'+line.slice(2)+'</strong>');i++;continue;}
    if(/^## /.test(line)){out.push('<strong style="font-size:12px;color:var(--v3);display:block;margin:8px 0 4px">'+line.slice(3)+'</strong>');i++;continue;}
    if(/^### /.test(line)){out.push('<strong style="font-size:11px;display:block;margin:6px 0 2px">'+line.slice(4)+'</strong>');i++;continue;}
    if(/^[\*\-] /.test(line)){out.push('<span style="display:block;padding-left:12px;margin:2px 0">▸ '+line.slice(2).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</span>');i++;continue;}
    out.push(line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'<br>');
    i++;
  }
  return out.join('');
}
var ICONS={Construccion:'🏗️',Mineria:'⛏️','Agricultura y ganaderia':'🌾','Pesca y acuicultura':'🐟','Servicios de salud':'🏥','Transporte y logistica':'🚛','Comercio al por menor':'🛒','Gastronomia y restaurantes':'🍽️','Saneamiento ambiental':'🧪','Proteccion contra incendios':'🧯','Silvicultura y forestal':'🌲',Educacion:'📚','Servicios de seguridad':'🛡️','Hoteleria y turismo':'🏨','Tecnologia y comunicaciones':'💻'};
function rubroIco(r){return ICONS[r]||'🏢';}

// ── INIT ──
try {
  checkLogin();
  loadFromCloud().then(function(synced){
    if(synced){ renderDash(); renderEmps(); }
  });
} catch(e) {
  console.error('Init error:', e);
  document.body.innerHTML = '<div style="color:white;padding:20px;font-family:sans-serif">' +
    '<h2>Plus Control</h2><p>Error de carga: ' + e.message + '</p>' +
    '<button onclick="location.reload()" style="padding:10px 20px;margin-top:10px">Recargar</button></div>';
}
