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

  // ══════════════════════════════════════════════════════
  // RIOHS — 8 PARTES (distribución por tokens, máx 7.500/parte)
  // p1(2.500) p2(6.300) p3(4.700) p4(7.500) p5(6.500) p6(7.500) p7(7.500) p8(6.800)
  // ══════════════════════════════════════════════════════

  // PARTE 1 — Cap.I solo (2.500 tokens)
  if(tipo==='riohs_p1') return I+'\nElabora RIOHS PARTE 1 — CAPÍTULO I para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO I: PREÁMBULO, VIGENCIA Y POLÍTICA DE SEGURIDAD Y SALUD EN EL TRABAJO\n\n'+
    'Art.1 Fundamento Legal y Objeto: DS 44/2024 (vigente 01-feb-2025, reemplaza DS 40/1969 y DS 54/1969), Ley 16.744, CT Arts.153-157 y 184, Ley 21.643 Ley Karin, DS 2/2024. Objeto: proteger vida e integridad de '+e.trabajadores+' trabajadores.\n\n'+
    'Art.2 Ámbito de Aplicación: aplica a TODOS los trabajadores de '+e.razon+' ('+e.cargos+'), contratistas, subcontratistas, visitas. Domicilio: '+e.direccion+', '+e.ciudad+', Región de '+e.region+'. Jornada: '+e.horario+' = '+e.horas_semanales+' hrs/semana (máx. legal 42 hrs desde 26-abr-2026, Ley 21.561/2023).\n\n'+
    'Art.3 Vigencia y Actualización: vigencia desde '+fecha+'. Revisión anual obligatoria. Modificaciones con 30 días anticipación y aprobación DT (CT Art.156).\n\n'+
    'Art.4 Política de Seguridad y Salud en el Trabajo: desarrollar política completa firmada por '+e.rep_nombre+', con compromiso de la dirección, objetivos medibles 2026-2027 (accidentabilidad cero, 100% capacitación, EPP certificados, cumplimiento legal), responsabilidades de cada cargo ('+e.cargos+'), '+cphs_txt+', mejora continua.\n\n'+
    'Art.5 Difusión y Entrega: entrega gratuita a cada trabajador (CT Art.156), acuse de recibo firmado, carga en portal DT dentro de 15 días hábiles desde aprobación (CT Art.156 — NO 5 días), exhibición en lugar visible. TABLA ACUSE DE RECIBO obligatoria: Nombre | RUT | Cargo | Fecha recepción | Firma.\n\nAl terminar escribe exactamente: ===R1FIN===';

  // PARTE 2 — Cap.II + III (6.300 tokens)
  if(tipo==='riohs_p2') return I+'\nElabora RIOHS PARTE 2 — CAPÍTULOS II y III para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO II: DEFINICIONES Y GLOSARIO (DS 44/2024 + Ley 21.643)\n'+
    'Desarrollar MÍNIMO 20 definiciones completas, mínimo 3 oraciones cada una. OBLIGATORIAS:\n'+
    '1. Acoso laboral (CT Art.2° inc.2° letra b, modificado por Ley 21.643): toda conducta de agresión u hostigamiento física o psicológica, ejercida por el empleador o por uno o más trabajadores contra otro u otros, por cualquier medio (verbal, escrito, no verbal, digital), que tenga como resultado menoscabo, maltrato o humillación, o que amenace o perjudique su situación laboral. La Ley Karin ELIMINÓ el requisito de reiteración: basta UNA SOLA conducta grave. Conductas constitutivas de acoso laboral según la DT (fuente oficial dt.gob.cl): (1) violencia física sobre el trabajador o sus pertenencias; (2) intimidación, amenazas y conductas de violencia psicológica; (3) obligar a ejecutar tareas en contra de la conciencia del trabajador; (4) juzgar el desempeño del trabajador de manera ofensiva; (5) cuestionar injustificadamente decisiones del trabajador; (6) no asignar tareas, asignar tareas sin sentido, asignar tareas muy por debajo de las capacidades o sobrecargar de tareas; (7) aislar o ignorar al trabajador; (8) gritos y gestos agresivos o intimidatorios; (9) creación de ambiente de trabajo hostil y ofensivo. IMPORTANTE: basta UNA SOLA conducta grave para configurar acoso laboral (CT Art.2° inc.2° letra b) modificado por Ley 21.643 — eliminó el requisito de reiteración).\n'+
    '2. Acoso sexual (CT Art.2 inc.2: requerimiento sexual no consentido que amenace situación laboral)\n'+
    '3. Violencia en el trabajo (Ley 21.643: fuerza física o psicológica de terceros con resultado de daño)\n'+
    '4. Peligro (DS 44/2024 Art.4 N°12: fuente con potencial de causar daño)\n'+
    '5. Riesgo (DS 44/2024 Art.4 N°19: combinación probabilidad y severidad)\n'+
    '6. Lugar de trabajo (DS 44/2024 Art.4 N°9: sitio bajo control directo o indirecto del empleador)\n'+
    '7. Medida de control (DS 44/2024 Art.4 N°10: acción para eliminar o reducir riesgo — jerarquía 5 niveles Art.11)\n'+
    '8. MIPER (DS 44/2024 Art.7: identificación peligros, evaluación riesgos, medidas control)\n'+
    '9. Derecho a Saber (DS 44/2024 Art.14-15: derecho trabajador a ser informado de riesgos de su puesto)\n'+
    '10. EPP (DS 44/2024 Art.4 N°5 y Art.13: dispositivo protección individual, gratuito, certificado ISP)\n'+
    '11. Incidente (DS 44/2024 Art.4 N°8: evento sin lesión o con primeros auxilios solamente)\n'+
    '12. Accidente del trabajo (Ley 16.744 Art.5: lesión a causa o con ocasión del trabajo)\n'+
    '13. Accidente de trayecto (Ley 16.744 Art.5 inc.2: trayecto directo entre domicilio y trabajo)\n'+
    '14. Enfermedad profesional (Ley 16.744 Art.7: causada directamente por el ejercicio de la profesión)\n'+
    '15. Perspectiva de género (DS 44/2024 Art.16: diferencias biológicas y sociales en riesgos laborales)\n'+
    '16. '+cphs_txt+'\n'+
    '17. Programa de trabajo preventivo (DS 44/2024 Art.8: planificación actividades preventivas anuales)\n'+
    '18. OAL / Organismo Administrador Ley 16.744: '+e.mutualidad+' — entidad que administra el seguro de accidentes\n'+
    '19. DIAT (Denuncia Individual Accidente del Trabajo: formulario que presenta el empleador ante la mutual)\n'+
    '20. PTS (Procedimiento de Trabajo Seguro: instrucción paso a paso para tarea de alto riesgo)\n\n'+
    'CAPÍTULO III: ADMISIÓN, CONTRATACIÓN E INDUCCIÓN\n'+
    'Art.6 Proceso de ingreso: exámenes médicos según cargo y riesgo (NO exigibles como condición de contratación CT Art.2). Inducción SST mínimo 2 horas el primer día hábil.\n'+
    'Art.7 Documentos de ingreso: entrega RIOHS + MIPER + PTS específicos del cargo. Firma acuse recibo en registro de inducción.\n'+
    'Art.8 Derecho a Saber (DS 44/2024 Art.14-15): informar por escrito riesgos del puesto de '+e.rubro+', medidas preventivas, EPP obligatorio, procedimientos de emergencia. El trabajador firma el documento de Derecho a Saber.\n'+
    'Art.9 Contratistas y visitas: obligación de cumplir normas SST de '+e.razon+' mientras permanezcan en dependencias.\n\nAl terminar escribe exactamente: ===R2FIN===';

  // PARTE 3 — Cap.IV + V + VI (4.700 tokens)
  if(tipo==='riohs_p3') return I+'\nElabora RIOHS PARTE 3 — CAPÍTULOS IV, V y VI para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO IV: JORNADA LABORAL, REMUNERACIONES Y DESCANSOS (CT Arts.22, 41-55, 154, Ley 21.561)\n'+
    'Art.10 Jornada ordinaria: '+e.horario+'. Horas semanales: '+e.horas_semanales+'. Colación: mínimo 30 min (CT Art.34), no imputable a jornada.\n'+
    'Art.11 Jornada máxima legal: 42 hrs/semana vigente desde 26-abr-2026 (Ley 21.561/2023). Próxima reducción: 40 hrs en abr-2028. '+((parseInt(e.horas_semanales||42)>42)?'⚠️ ALERTA: las '+e.horas_semanales+' hrs declaradas EXCEDEN el máximo legal de 42 hrs — corregir de inmediato.':'')+'\n'+
    'Art.12 Horas extraordinarias: máx. 2 hrs/día, pacto escrito previo CT Art.32, recargo 50% sobre hora ordinaria, máx. 2 semanas continuas, límite 12 hrs semanales adicionales.\n'+
    'Art.13 '+cphs_txt+'\n'+
    'Art.14 Descansos legales: semanal (CT Art.35), feriados legales (CT Art.35), feriado proporcional (CT Art.67).\n'+
    'Art.15 Remuneraciones (CT Art.154 N°3 — OBLIGATORIO): describir los tipos de remuneración que reciben los trabajadores de '+e.razon+': sueldo base mensual, gratificaciones legales (CT Art.47: 25% de remuneraciones con tope de 4,75 IMM, o 30% de utilidades), bonos, comisiones u otros estipendios si aplican. Indicar que toda remuneración se paga en moneda de curso legal o depósito bancario.\n'+
    'Art.16 Lugar, día y hora de pago (CT Art.154 N°4 — OBLIGATORIO): el pago de remuneraciones se efectúa el último día hábil de cada mes (o la fecha pactada en el contrato individual), en el domicilio de '+e.razon+' ubicado en '+e.direccion+', '+e.ciudad+', o mediante depósito bancario en cuenta del trabajador. El empleador entregará liquidación de sueldo firmada en cada período de pago (CT Art.54 bis).\n'+
    'Art.17 Comprobación de obligaciones legales (CT Art.154 N°8 — OBLIGATORIO): al momento de la contratación y durante la vigencia del contrato, '+e.razon+' verificará: (a) afiliación previsional vigente — AFP e ISAPRE o FONASA; (b) cumplimiento del servicio militar obligatorio cuando corresponda (Ley 27.000); (c) cédula de identidad vigente — sin cédula vencida ningún trabajador puede iniciar funciones; (d) certificado de antecedentes cuando la naturaleza del cargo lo justifique; (e) en caso de trabajadores menores de 18 años (si aplica), certificado de haber cumplido la obligación escolar conforme a la Ley General de Educación. El empleador mantendrá copia de estos documentos en la carpeta personal de cada trabajador, disponible para fiscalización de la Dirección del Trabajo.\n\n'+
    'CAPÍTULO V: OBLIGACIONES DEL EMPLEADOR (CT Art.184, DS 44/2024, Ley 16.744)\n'+
    'Desarrollar mínimo 10 obligaciones específicas con base legal para '+e.rubro+'. Incluir obligatoriamente:\n'+
    '- Proporcionar EPP gratuitos certificados ISP sin costo para el trabajador (Ley 16.744 Art.68 inc.3)\n'+
    '- Elaborar y mantener MIPER actualizada anualmente (DS 44/2024 Art.7)\n'+
    '- Capacitar mínimo 8 hrs anuales con enfoque género (DS 44/2024 Art.16). NOTA LEGAL OBLIGATORIA en este artículo: la capacitación en prevención de riesgos es una obligación del empleador y NO puede exigirse como requisito previo a la contratación del trabajador — es deber del empleador adiestrar a sus trabajadores, no del trabajador llegar capacitado (Dictamen SUSESO 1484/2004, DS 40/1969 Art.23).\n'+
    '- Entregar Derecho a Saber al inicio de labores y ante cambios de actividad, SIN COSTO para el trabajador (DS 44/2024 Art.15, DS 40/1969 Art.21). Para empresas como '+e.razon+' con '+nt+' trabajadores '+(nt<25?'(sin CPHS ni DPR obligatorio), el empleador entrega directamente el Derecho a Saber en la forma más conveniente y adecuada según DS 40/1969 Art.23 y Dictamen SUSESO 1484/2004.':'con CPHS, el Derecho a Saber se entrega a través del CPHS.')+'\n'+
    '- Investigar accidentes e incidentes (DS 44/2024 Art.18)\n'+
    '- Implementar Protocolo Ley Karin (Ley 21.643 + DS 2/2024)\n'+
    '- Mantener registros disponibles para DT, SEREMI Salud y '+e.mutualidad+'\n'+
    '- Notificar accidentes graves y fatales a SEREMI Salud y DT dentro de 24 hrs\n\n'+
    'CAPÍTULO VI: IDENTIFICACIÓN DE RIESGOS ESPECÍFICOS DEL RUBRO\n'+
    'Desarrollar mínimo 12 riesgos REALES de '+e.rubro+' / '+e.subrubro+' con sus medidas de control. Agrupar en:\n'+
    '- Riesgos físicos: ruido='+e.ruido+', temperatura='+e.temperatura+', vibraciones='+e.vibracion+', radiación='+e.radiacion+'\n'+
    '- Riesgos químicos: '+e.sustancias+'\n'+
    '- Riesgos ergonómicos: MMC (Ley 20.949: 25 kg hombres, 15 kg mujeres), posturas, repetitividad\n'+
    '- Riesgos de seguridad: altura='+e.trab_altura+', caliente='+e.trab_caliente+', confinado='+e.trab_confinado+', presión='+e.trab_presion+', vehículos='+e.trab_vehiculos+'\n'+
    '- Riesgos psicosociales: CEAL-SM-SUSESO, Ley Karin, fatiga, nocturno='+e.trab_nocturno+'\n\nAl terminar escribe exactamente: ===R3FIN===';

  // PARTE 4 — Cap.VII + VIII (7.500 tokens)
  if(tipo==='riohs_p4') return I+'\nElabora RIOHS PARTE 4 — CAPÍTULOS VII y VIII para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO VII: OBLIGACIONES DE LOS TRABAJADORES (DS 44/2024 Art.5, CT Art.184)\n'+
    'Desarrollar MÍNIMO 15 artículos numerados, específicos para '+e.rubro+' / '+e.subrubro+'. Cada artículo mínimo 3 oraciones. Incluir OBLIGATORIAMENTE:\n'+
    '- Conocer y cumplir el RIOHS (inducción, firma acuse recibo)\n'+
    '- Usar correctamente EPP asignados durante toda la exposición al riesgo\n'+
    '- Reportar inmediatamente condiciones inseguras, incidentes y accidentes\n'+
    '- Asistir a capacitaciones y simulacros obligatorios\n'+
    '- Cumplir estrictamente los PTS de '+e.rubro+'\n'+
    '- Prohibición absoluta de trabajar bajo efectos de alcohol o drogas (DS 44/2024 Art.9)\n'+
    '- Mantener orden y aseo en puesto de trabajo (DS 594/1999)\n'+
    '- Cuidar herramientas, equipos y vehículos de la empresa\n'+
    '- Reportar todo accidente del trabajo dentro de las 24 horas (Ley 16.744 Art.76)\n'+
    '- Participar en asambleas mensuales de seguridad\n'+
    '- Respetar señalética de seguridad\n'+
    '- Conducción segura de vehículos (si aplica para '+e.trab_vehiculos+')\n'+
    '- Informar enfermedades o impedimentos que afecten trabajo seguro\n'+
    '- Cooperar en investigaciones de accidentes y denuncias Ley Karin\n\n'+
    'CAPÍTULO VIII: PROHIBICIONES (CT Art.154 bis, DS 44/2024)\n'+
    'Desarrollar MÍNIMO 12 prohibiciones, específicas para '+e.rubro+'. Incluir:\n'+
    '- Presentarse bajo efectos de alcohol o drogas\n'+
    '- Fumar en zonas de riesgo o no habilitadas\n'+
    '- Desactivar o neutralizar dispositivos de seguridad\n'+
    '- Usar EPP en mal estado o de otro trabajador\n'+
    '- Modificar o reparar equipos sin autorización\n'+
    '- Transportar personas no autorizadas en vehículos empresa\n'+
    '- Usar celular durante conducción o tareas de alto riesgo\n'+
    '- Ejecutar trabajos de alto riesgo sin PTS y EPP\n'+
    '- Retirar o dañar señalética de seguridad\n'+
    '- Acoso laboral o sexual (Ley 21.643)\n'+
    '- Falsificar registros, certificados o documentos\n'+
    '- Trabajar sobre 42 hrs/semana sin pacto escrito (CT Art.32)\n\nAl terminar escribe exactamente: ===R4FIN===';

  // PARTE 5 — Cap.IX + X + XI (6.500 tokens)
  if(tipo==='riohs_p5') return I+'\nElabora RIOHS PARTE 5 — CAPÍTULOS IX, X y XI para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO IX: DERECHO A SABER — INFORMACIÓN DE RIESGOS POR PUESTO (DS 44/2024 Art.14-15)\n'+
    'Tabla en formato markdown por cada cargo real ('+e.cargos+'). Columnas OBLIGATORIAS: Cargo | Tarea específica (R/NR) | Peligro — Fuente/Situación | Peligro — Acto/condición insegura | Tipo peligro | Consecuencia potencial | P(1-5) | S(1-5) | VEP | Nivel riesgo | Medida preventiva (jerarquía ISP) | EPP obligatorio con norma NCh | Método de trabajo seguro/PTS asociado | Norma aplicable. Mínimo 4 filas por cargo. Protocolo de entrega con firma del trabajador. Actualización ante cambios en el puesto.\n\n'+
    'CAPÍTULO X: EQUIPOS DE PROTECCIÓN PERSONAL — EPP (DS 44/2024 Art.13, Ley 16.744 Art.68)\n'+
    'Tabla en formato markdown. Columnas: Cargo | EPP específico | Norma NCh | Certificación ISP | Situación de uso | Frecuencia reposición | Responsable entrega. Incluir todos los cargos de '+e.razon+'. EPP específicos para '+e.rubro+'. Procedimiento entrega con registro firmado, reposición inmediata sin costo, responsabilidad del trabajador de informar deterioro.\n\n'+
    'CAPÍTULO XI: ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES (Ley 16.744)\n'+
    'Art.X+1 Definiciones: accidente del trabajo (Art.5), accidente de trayecto (Art.5 inc.2 — trayecto directo, trabajador presenta DIAT personalmente), enfermedad profesional (Art.7), incidente o cuasi-accidente.\n'+
    'Art.X+2 Procedimiento ante accidente: primeros auxilios → SAMU 131 si necesario → traslado a '+e.hospital+' → DIAT ante '+e.mutualidad+' dentro de las 24 horas siguientes al accidente (Ley 16.744 Art.76) → investigación interna.\n'+
    'Art.X+3 Investigación: metodología árbol de causas, informe escrito, medidas correctivas con plazo y responsable, comunicación a todos los trabajadores.\n'+
    'Art.X+4 Enfermedades profesionales: procedimiento denuncia DEP ante '+e.mutualidad+', vigilancia médica, reubicación si procede.\n'+
    'Art.X+5 Registro y estadísticas: libro de accidentes, tasas accidentabilidad, frecuencia y gravedad diferenciadas por género, reporte anual.\n\nAl terminar escribe exactamente: ===R5FIN===';

  // PARTE 6 — Cap.XII + XIII + XIV + XV (7.500 tokens)
  if(tipo==='riohs_p6') return I+'\nElabora RIOHS PARTE 6 — CAPÍTULOS XII, XIII, XIV y XV para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO XII: RIESGOS PSICOSOCIALES Y PROTOCOLO ALCOHOL/DROGAS (DS 44/2024, CEAL-SM-SUSESO)\n'+
    '- Evaluación CEAL-SM-SUSESO: 6 dimensiones (carga laboral, desarrollo tareas, liderazgo, relaciones sociales, doble presencia, compensaciones), aplicación cada 2 años, medidas organizacionales.\n'+
    '- NOTA: Protocolo Ley Karin completo en Capítulo XX.\n'+
    '- Protocolo alcohol y drogas (DS 44/2024 Art.9): prohibición absoluta con base legal. Indicios razonables: aliento alcohólico, conducta alterada, coordinación deteriorada, ojos enrojecidos. Test por profesional de salud o institución acreditada, cadena de custodia, derecho a segunda muestra. Resultado positivo: suspensión inmediata + proceso disciplinario. Negativa al test: se considera positivo (criterio DT).\n\n'+
    'CAPÍTULO XIII: REPRESENTACIÓN PREVENTIVA Y PARTICIPACIÓN (DS 44/2024 Arts.23-37)\n'+
    cphs_txt+'. Desarrollar completamente: '+
    (e.trabajadores<10 ? 'mecanismo de participación directa, asambleas mensuales obligatorias (fecha, hora, lugar, temario mínimo, acta firmada), canales de comunicación, derecho a información (DS 44/2024 Art.5), derecho a consulta (Art.6), derecho a paralización faenas riesgo grave e inminente (CT Art.184 + DS 44/2024 Art.12).' :
     e.trabajadores<25 ? 'Delegado SST: elección democrática, funciones, mandato, protección. Asambleas mensuales. Derechos de los trabajadores.' :
     'CPHS: constitución, representantes, funciones DS 44/2024 Art.23, reuniones mensuales, actas, facultades.')+'\n\n'+
    'CAPÍTULO XIV: SISTEMA DE GESTIÓN PREVENTIVA (DS 44/2024 Arts.7-22)\n'+
    '- MIPER: metodología VEP (Valor Esperado de la Pérdida, Guía ISP v3 2024, Res.Ex. E668/25) con enfoque género, identificación sistemática todos los peligros de '+e.rubro+', revisión anual o ante cambios, disponible para consulta de trabajadores.\n'+
    '- Programa de Trabajo Preventivo: elaborar dentro de 30 días de la MIPER, mínimo: capacitaciones, inspecciones, evaluaciones ambientales, simulacros.\n'+
    '- Vigilancia de la salud: exámenes según riesgo del cargo, coordinación con '+e.mutualidad+'.\n'+
    '- Jerarquía de controles (DS 44/2024 Art.11): eliminación → sustitución → ingeniería → administrativos → EPP.\n'+
    '- Informe IPER del Organismo Administrador (Compendio SUSESO Libro IV Letra C): '+e.razon+' tiene derecho a recibir de '+e.mutualidad+' un informe formal con: (a) factor de riesgo y valoración; (b) medidas preventivas a implementar; (c) plazos; (d) profesional responsable. Es GRATUITO por ser empresa adherida — solicitarlo una vez validada la MIPER.\n'+
    '- Asistencia técnica gratuita del OA (Compendio SUSESO Libro IV Letra C): '+e.mutualidad+' tiene obligación de evaluar al menos cada 2 años que empresas sin experto en prevención hayan actualizado su MIPER, y otorgar asistencia técnica gratuita para ello. '+(nt<=100?''+e.razon+' ('+e.trabajadores+' trabajadores, sin DPR obligatorio) puede exigir esta asistencia técnica a '+e.mutualidad+' sin costo adicional.':'Aun con DPR, la mutualidad puede brindar asistencia complementaria.')+'\n\n'+
    'CAPÍTULO XV: ORDEN, HIGIENE Y CONDICIONES SANITARIAS (DS 594/1999 MINSAL)\n'+
    '- Servicios higiénicos según DS 594 Art.25-28: requerimientos para '+e.trabajadores+' trabajadores, '+(e.mujeres||0)+' mujeres.\n'+
    '- Agua potable, comedor (DS 594 Art.28), vestuarios si corresponde.\n'+
    '- Iluminación mínima según tipo de tarea (DS 594 Art.103).\n'+
    '- Ventilación y temperatura (DS 594 Arts.32-35).\n'+
    '- Almacenamiento de sustancias: '+e.sustancias+' — condiciones específicas DS 594.\n'+
    '- Manipulación manual de cargas (Ley 20.949/2016, DS 63/2005): límites 25 kg hombres adultos / 15 kg mujeres adultas en condiciones ideales; reducir ante postura inadecuada, frecuencia alta o distancia.\n\nAl terminar escribe exactamente: ===R6FIN===';

  // PARTE 7 — Cap.XVI + XVII + XVIII (7.500 tokens)
  if(tipo==='riohs_p7') return I+'\nElabora RIOHS PARTE 7 — CAPÍTULOS XVI, XVII y XVIII para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO XVI: PLAN DE EMERGENCIA Y EVACUACIÓN (DS 594 Art.44-54, DS 44/2024 Art.19)\n'+
    '⚠️ INSTRUCCIÓN: Este capítulo es el RESUMEN ejecutivo del Plan de Emergencia dentro del RIOHS. Desarrollar con artículos completos (mínimo 3 oraciones c/u), NO en bullets.\n'+
    '- Art.XVI.1 Marco legal y relación con Plan de Emergencia autónomo: este capítulo complementa el Plan de Emergencia y Evacuación independiente de '+e.razon+'. Fundamento: DS 594/1999 Arts.44-54, DS 44/2024 Art.19, Ley 16.744.\n'+
    '- Art.XVI.2 Escenarios identificados para '+e.rubro+'/'+e.subrubro+': incendio, derrame químico ('+e.sustancias+'), sismo, accidente grave/fatal, emergencia médica. Procedimiento de 3 fases (antes/durante/después) para cada escenario.\n'+
    '- Art.XVI.3 Roles nominados: Jefe de Emergencia ('+e.rep_nombre+'), Coordinador Evacuación, Primeros Auxilios, Comunicaciones. Una persona puede tener más de un rol en empresa de '+e.trabajadores+' trabajadores.\n'+
    '- Art.XVI.4 Recursos disponibles: extintores='+e.extintores+', alarma='+e.alarma+', botiquín='+e.botiquin+', primeros auxilios capacitado='+e.primeros_auxilios+'.\n'+
    '- Art.XVI.5 Simulacros: mínimo 1 anual obligatorio (DS 44/2024 Art.19). REGISTRO OBLIGATORIO: fecha | escenario simulado | tiempo evacuación | N° participantes con firma | observaciones | plan mejora con responsable y plazo.\n'+
    '- DIRECTORIO DE EMERGENCIAS (incluir TODOS con número verificado):\n'+
    '  Bomberos 132 | SAMU 131 | Carabineros 133 | SENAPRED 1424\n'+
    '  '+getTelMutualidad(e.mutualidad)+'\n'+
    '  '+getSEREMI(e.region)+'\n'+
    '  Hospital más cercano: '+e.hospital+'\n'+
    '  Contacto empresa: '+e.telefono+'\n\n'+
    'CAPÍTULO XVII: INVESTIGACIÓN DE ACCIDENTES E INCIDENTES (DS 44/2024 Art.18, Ley 16.744 Art.76)\n'+
    '- Obligación de investigar todo accidente del trabajo y cuasi-accidente.\n'+
    '- Metodología: árbol de causas o 5-Por qué, causas inmediatas y básicas, factores contribuyentes.\n'+
    '- DIAT: presentar ante '+e.mutualidad+' dentro de las 24 horas siguientes al accidente (Ley 16.744 Art.76).\n'+
    '- Informe de investigación: descripción, causas, medidas correctivas con responsable y plazo.\n'+
    '- Comunicación a trabajadores de los resultados y medidas adoptadas.\n'+
    '- Estadísticas: tasa accidentabilidad, frecuencia, gravedad. Diferenciadas por género.\n\n'+
    'CAPÍTULO XVIII: INFRACCIONES Y SANCIONES (CT Art.154 N°7, CT Art.157)\n'+
    'Desarrollar con artículos numerados completos. Mínimo 6 ejemplos específicos de '+e.rubro+' en cada categoría:\n'+
    'Art.1 Fundamento legal y ámbito — Art.2 INFRACCIONES LEVES: mínimo 8 ejemplos específicos del rubro — Art.3 INFRACCIONES GRAVES: mínimo 8 ejemplos específicos — Art.4 INFRACCIONES GRAVÍSIMAS: mínimo 6 ejemplos específicos — Art.5 ESCALA DE SANCIONES: amonestación verbal → amonestación escrita → multa máx.25% remuneración diaria (CT Art.154 N°7) → término contrato Art.160 N°1 CT. Destino multas: fondos bienestar (CT Art.157) — Art.6 PROCEDIMIENTO SANCIONATORIO: 7 fases (constatación 24hrs / comunicación 3 días hábiles / descargos 5 días hábiles / investigación / resolución 10 días hábiles / notificación / registro) — Art.7 Non bis in idem — Art.8 Prescripción: leves 6 meses, graves 12 meses — Art.9 Registro Centralizado de Sanciones — Art.10 Infracción Ley 21.561: trabajar sobre 42 hrs sin pacto escrito CT Art.32 = infracción grave.\n\nAl terminar escribe exactamente: ===R7FIN===';

  // PARTE 8 — Cap.XIX + XX + XXI + XXII (6.800 tokens)
  if(tipo==='riohs_p8') return I+'\nElabora RIOHS PARTE 8 FINAL — CAPÍTULOS XIX, XX, XXI y XXII para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'CAPÍTULO XIX: CANALES DE DENUNCIA Y RECLAMO (CT Arts.154 N°6, N°12, N°13)\n'+
    'Art.1 Canal interno general: '+e.rep_nombre+', '+e.rep_cargo+', correo: '+(e.email||'ver datos de contacto')+'. Todo trabajador puede plantear peticiones, reclamos, consultas y sugerencias ante esta persona conforme CT Art.154 N°6. Acuse recibo 2 días hábiles.\n'+
    'Art.2 Canal DT externo: dt.gob.cl, fono 600 4500 247, oficina Inspección del Trabajo Región de '+e.region+'.\n'+
    'Art.3 Canal SUSESO (prestaciones Ley 16.744): 600 4200 400. '+getSEREMI(e.region)+'.\n'+
    'Art.4 Plazos: resolución interna 30 días hábiles. La respuesta del empleador deberá ser por escrito y fundada (CT Art.154 inc.final).\n'+
    'Art.5 Protección denunciante: confidencialidad, prohibición de represalias.\n'+
    'Art.6 Procedimiento de reclamo por igualdad de remuneraciones entre hombres y mujeres (CT Art.154 N°13 — OBLIGATORIO): conforme al principio de igualdad de remuneraciones establecido en el CT Art.62 bis, todo trabajador o trabajadora de '+e.razon+' que considere que está percibiendo una remuneración inferior a la de otro trabajador del sexo contrario que realice el mismo trabajo, tiene derecho a presentar reclamo formal. El procedimiento es el siguiente: (a) el trabajador o trabajadora presenta reclamo escrito ante '+e.rep_nombre+', '+e.rep_cargo+', indicando el nombre del trabajador con quien compara su remuneración, el cargo que ambos desempeñan y la diferencia remuneracional que estima injustificada; (b) el empleador deberá responder por escrito dentro de 30 días corridos, indicando si acoge o rechaza el reclamo, con los fundamentos de su decisión; (c) si el reclamo es rechazado o no recibe respuesta en el plazo, el trabajador puede recurrir a la Inspección del Trabajo competente (Región de '+e.region+', fono 600 4500 247, portal dt.gob.cl); (d) las diferencias remuneraciones no podrán fundarse en criterios basados en el sexo o género de los trabajadores, sino exclusivamente en capacidades, calificaciones, idoneidad, responsabilidad o productividad.\n\n'+
    'CAPÍTULO XX: PROTOCOLO LEY KARIN — PREVENCIÓN Y SANCIÓN VIOLENCIA LABORAL (Ley 21.643 + DS 2/2024)\n'+
    'Desarrollar COMPLETAMENTE. Mínimo 3 oraciones por artículo:\n'+
    'Art.6 Ámbito: '+e.razon+', incluyendo conductas de clientes/proveedores/público hacia trabajadores.\n'+
    'Art.7 Acoso laboral (CT Art.2° inc.2° letra b, modificado por Ley 21.643): toda conducta de agresión u hostigamiento física o psicológica, ejercida por el empleador o por uno o más trabajadores contra otro u otros, por cualquier medio, que tenga como resultado menoscabo, maltrato o humillación, o que amenace o perjudique la situación laboral. La Ley Karin eliminó el requisito de reiteración: UNA SOLA conducta grave configura acoso laboral. Conductas constitutivas de acoso laboral según la DT (fuente oficial dt.gob.cl): (1) violencia física sobre el trabajador o sus pertenencias; (2) intimidación, amenazas y conductas de violencia psicológica; (3) obligar a ejecutar tareas en contra de la conciencia del trabajador; (4) juzgar el desempeño del trabajador de manera ofensiva; (5) cuestionar injustificadamente decisiones del trabajador; (6) no asignar tareas, asignar tareas sin sentido, asignar tareas muy por debajo de las capacidades o sobrecargar de tareas; (7) aislar o ignorar al trabajador; (8) gritos y gestos agresivos o intimidatorios; (9) creación de ambiente de trabajo hostil y ofensivo. IMPORTANTE: basta UNA SOLA conducta grave para configurar acoso laboral (CT Art.2° inc.2° letra b) modificado por Ley 21.643 — eliminó el requisito de reiteración).\n'+
    'Art.8 Acoso sexual (CT Art.2° inc.2° letra a, modificado por Ley 21.643): Conductas constitutivas de acoso sexual según la DT (fuente oficial dt.gob.cl): toda conducta realizada de forma indebida y por cualquier medio que implique requerimientos (imposiciones, exigencias, invitaciones, etc.) de carácter sexual por una persona contra otra que no consiente, y que amenacen o perjudiquen su situación laboral o sus oportunidades en el empleo (CT Art.2° inc.2° letra a), modificado por Ley 21.643). Incluye: insinuaciones verbales, comentarios de connotación sexual, mensajes digitales, contacto físico no consentido, exhibición de material sexual, promesas de beneficios laborales condicionadas a favores sexuales, amenazas ante negativa.\n'+
    'Art.9 Violencia en el trabajo ejercida por terceros (CT Art.2° inc.2° letra c, modificado por Ley 21.643): Violencia ejercida por terceros según la DT (fuente oficial dt.gob.cl): cualquier conducta dañina ejercida por personas ajenas a la empresa — clientes, proveedores, usuarios u otros — que afecte a las y los trabajadores CON OCASIÓN de la prestación de sus servicios, sea dentro o fuera del lugar de trabajo (CT Art.2° inc.2° letra c) modificado por Ley 21.643). Incluye: agresiones físicas, intimidación, amenazas verbales o escritas, insultos y trato denigrante.\n'+
    'Art.10 Medidas preventivas: capacitación anual, CEAL-SM-SUSESO, difusión trimestral protocolo.\n'+
    'Art.11 Responsable nominado: '+e.rep_nombre+', '+e.rep_cargo+', '+( e.email||'ver contacto empresa')+'. Acuse recibo DENTRO DE 2 DÍAS HÁBILES.\n'+
    'Art.12 Medidas cautelares DENTRO DE 5 DÍAS HÁBILES: separación física obligatoria, redistribución tareas.\n'+
    'Art.13 Investigación: investigador imparcial en 3 días hábiles. Empresas <10 trabajadores pueden derivar a IT. Informe DENTRO DE 30 DÍAS HÁBILES.\n'+
    'Art.14 Sanciones al infractor: amonestación → multa → término contrato Art.160 N°1 CT letra f).\n'+
    'Art.15 Protección denunciante: confidencialidad, no represalias, no despido sin autorización DT durante investigación.\n'+
    'Art.16 Canal externo DT: dt.gob.cl / 600 4500 247. Plazo: 90 DÍAS CORRIDOS desde el hecho.\n'+
    'Art.17 Registro de denuncias reservado y estadísticas anuales.\n\n'+
    'CAPÍTULO XXI: DISPOSICIONES FINALES\n'+
    'Art.18 Vigencia desde '+fecha+', revisión anual obligatoria.\n'+
    'Art.19 Entrega gratuita con acuse de recibo firmado (CT Art.156).\n'+
    'Art.20 Carga en portal DT dentro de 15 días hábiles desde aprobación (CT Art.156).\n'+
    'Art.21 Modificaciones: 30 días anticipación, aprobación Inspección del Trabajo.\n\n'+
    'CAPÍTULO XXII: CONTROL DOCUMENTAL Y FIRMAS\n'+
    ctrl+'\n\n'+
    'AUTORIZACIÓN Y FIRMA DEL DOCUMENTO\n'+
    'Documento elaborado conforme a normativa chilena vigente. Queda sujeto a la aprobación de los firmantes.\n\n'+
    'Elaborado por: Alan Bascur Montenegro | Ingeniero en Prevención de Riesgos | RUT: 17.658.387-8 | Plus Control SpA | Lastarrias 602, Osorno, Los Lagos | Fecha: '+fecha+'\n\n'+
    'Aprobado por: '+e.rep_nombre+' | '+e.rep_cargo+' | RUT: '+e.rep_rut+' | '+e.razon+
    (e.rep2_nombre?'\n\nFirma y timbre: '+e.rep2_nombre+' | Representante Legal | RUT: '+(e.rep2_rut||'---')+' | '+e.razon:'')+
    '\n\nFecha de aprobación: '+fecha+'.';

    if(tipo==='iper_p1') return I+'\nElabora MATRIZ IPER DS 44/2024 PARTE 1 para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    'ENCABEZADO FORMAL completo con datos del cliente arriba.\n\n'+
    'METODOLOGÍA OFICIAL ISP v3 2024 — VALOR ESPERADO DE LA PÉRDIDA (VEP) CON ENFOQUE DE GÉNERO (DS 44/2024 Art.7 + Guía ISP Res.Ex. E668/25):\n'+
    'IMPORTANTE: La Guía ISP v3 2024 (vigente desde 01-feb-2025) introduce la metodología VEP para riesgos de seguridad, desastres y emergencias. '+
    'Aplica VEP para todos los riesgos de seguridad. Para riesgos higiénicos usa protocolos MINSAL. Para psicosociales usa CEAL-SM-SUSESO.\n\n'+
    'METODOLOGÍA VEP (Valor Esperado de la Pérdida) para riesgos de seguridad:\n'+
    'Probabilidad (P) 1-5: 1=Muy improbable (<1 vez/10 años), 2=Improbable (1 vez/5-10 años), 3=Posible (1 vez/1-5 años), 4=Probable (1 vez/año), 5=Muy probable (1 vez/mes o más).\n'+
    'Severidad (S) 1-5: 1=Insignificante (primeros auxilios sin días perdidos), 2=Menor (lesión leve, <3 días perdidos), 3=Moderada (lesión tratable médicamente, >3 días perdidos), 4=Mayor (incapacidad permanente parcial), 5=Catastrófica (muerte o incapacidad total permanente).\n'+
    'VEP = P × S. Clasificación de nivel de riesgo: Trivial (VEP 1-4, acción: sin mejora inmediata), Tolerable (VEP 5-8, acción: mantener controles actuales), Moderado (VEP 9-16, acción: implementar controles en plazo definido), Importante (VEP 17-24, acción: no iniciar trabajo sin reducir riesgo), Intolerable (VEP 25, acción: paralizar faena).\n'+
    'JERARQUÍA DE CONTROLES (DS 44/2024 Art.11 — aplicar en este orden): 1°Eliminación del peligro → 2°Sustitución → 3°Controles de ingeniería → 4°Controles administrativos → 5°EPP (última opción).\n'+
    'NOTA EN ENCABEZADO MIPER: '+e.mutualidad+' tiene la obligación de otorgar asistencia técnica gratuita para la elaboración y actualización de esta MIPER (Compendio SUSESO Libro IV Letra C). '+(nt<=100?''+e.razon+' puede solicitar esta asistencia a su OA sin costo adicional.':'Empresa puede complementar con asistencia del OA.')+' Asimismo, la empresa tiene derecho a recibir del OA un informe formal con los resultados de la IPER (factor de riesgo, valoración, medidas, plazos y profesional responsable).\n\n'+
    'TABLA MIPER — primera mitad de puestos/procesos de '+e.rubro+'/'+e.subrubro+':\n'+
    'Columnas: N°|Área/Proceso|Actividad (Rutinaria/No rutinaria — marcar R o NR)|Puesto de Trabajo|¿Por empresa propia o empresa de servicio/contratista? (marcar EP o ES)|Tarea específica|Peligro — Fuente o Situación (origen físico: equipo, material, ambiente)|Peligro — Acto o condición insegura (comportamiento o estado que activa el peligro)|Tipo peligro (seguridad/higiénico/ergonómico/psicosocial)|Incidente potencial / Consecuencia|N° trab. expuestos (máx. '+e.trabajadores+')|Género expuesto (H/M/Ambos)|P (1-5)|S (1-5)|VEP=P×S|Nivel riesgo (Trivial/Tolerable/Moderado/Importante/Intolerable)|Normativa aplicable|Control: Eliminación/Sustitución|Control: Ingeniería|Control: Administrativo/PTS asociado|EPP con norma NCh.\n'+
    'INSTRUCCIÓN COLUMNAS NUEVAS: (1) Rutinaria=actividad regular del trabajo diario; No Rutinaria=mantenimiento, emergencias, tareas esporádicas o de inicio/cierre. (2) Separar siempre Fuente/Situación del Acto: Fuente=origen físico del peligro (ej: sustancia corrosiva sin rotular), Acto=comportamiento que lo activa (ej: manipular sin guantes). (3) EP=personal propio de '+e.razon+'; ES=contratistas o personal de empresas de servicio que operen en las mismas instalaciones.\n'+
    'Mínimo 15 registros con peligros REALES de: '+e.subrubro+'. '+
    (e.mujeres>0?'PERSPECTIVA DE GÉNERO OBLIGATORIA: generar filas específicas para los '+e.mujeres+' cargos femeninos con análisis diferencial de: exposición a plaguicidas (límites menores), carga manual (15 kg máx.), riesgo violencia/acoso de clientes (Ley Karin), ergonomía de pie (TMERT). ':'')+
    'Incluir: '+e.sustancias+', altura='+e.trab_altura+', caliente='+e.trab_caliente+', confinado='+e.trab_confinado+', presión='+e.trab_presion+'.\n\nAl terminar escribe exactamente: ===IPER1FIN===';

  if(tipo==='iper_p2') return I+'\nElabora MATRIZ IPER DS 44/2024 PARTE 2 para el siguiente cliente:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
    'SEGUNDA MITAD: mismas columnas VEP (P|S|VEP|Nivel riesgo), mínimo 15 registros adicionales. OBLIGATORIO incluir: riesgos ergonómicos (MMC Ley 20.949/2016 + DS 63/2005, posturas forzadas, TMERT Res.327/2024), riesgos psicosociales (CEAL-SM-SUSESO), exposición a '+e.sustancias+', ruido='+e.ruido+', polvo='+e.polvo+', temperatura='+e.temperatura+', biológico='+e.biologico+'.\n\n'+
    'TABLA RIESGOS PSICOSOCIALES: instrumento '+(e.mutualidad||'mutualidad')+' / CEAL-SM-SUSESO. Dimensiones, nivel riesgo, medidas organizacionales.\n\n'+
    'PLAN DE ACCIÓN — riesgos Importantes e Intolerables:\n'+
    'Columnas: N°|Peligro|Nivel|Medida correctiva específica|Responsable (cargo real)|Plazo días hábiles|Recurso|Indicador cumplimiento|Fecha seguimiento|Estado.\n'+
    'NOTA CIERRE PLAN DE ACCIÓN (Compendio SUSESO Libro IV Letra C): '+e.mutualidad+' debe emitir a '+e.razon+' un informe formal con los resultados de la IPER (factor de riesgo, valoración, medidas, plazos, profesional responsable) — es GRATUITO. Solicitar a '+e.mutualidad+' una vez validada esta MIPER. Además, '+e.mutualidad+' tiene obligación de evaluar cada 2 años la actualización de la MIPER y brindar asistencia técnica gratuita.\n\n'+
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
    var p1 = I+'\nFUF DS 44/2024 PARTE 1 — Ítems 1 al 28 para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
      'INSTRUCCIÓN: Evalúa EXACTAMENTE los siguientes 28 ítems del FUF oficial DS 44/2024. Para cada ítem indica CUMPLE / NO CUMPLE / NO APLICA con justificación específica basada en los datos reales del cliente. NO omitas ningún ítem. '+
      (nt<10?'EMPRESA <10 TRABAJADORES: ítems de CPHS y Delegado SST serán NO APLICA.':nt<25?'EMPRESA 10-24 TRABAJADORES: Delegado SST APLICA, CPHS NO APLICA.':'EMPRESA ≥25 TRABAJADORES: CPHS APLICA.')+'\n\n'+

      '--- SECCIÓN 1: SGSST — SISTEMA DE GESTIÓN SST (Art.22, Art.64) ---\n'+
      'Ítem 1: ¿La entidad empleadora cuenta con un Sistema de Gestión SST que contiene como mínimo: a) Política de SST; b) Estructura organizacional para la gestión preventiva; c) Diagnóstico, planificación y programación de la actividad preventiva; d) Evaluación o auditoría periódica del desempeño del SGSST; e) Acciones de mejora continua o correctivas? (Art.22 inc.1, Art.64 inc.1). '+
      'Verificar en '+e.razon+' ('+e.trabajadores+' trabajadores, rubro: '+e.rubro+') si existe política escrita firmada por '+e.rep_nombre+', estructura con responsabilidades asignadas, programa preventivo actualizado, auditoría o autoevaluación periódica y registro de mejoras.\n\n'+

      '--- SECCIÓN 2: MIPER (Art.7) ---\n'+
      'Ítem 2: ¿Cuenta con MIPER que incorpore todos los procesos, tareas y puestos de trabajo? (Art.7 inc.1). '+
      'Verificar cobertura de: '+e.cargos+'. Procesos declarados: '+e.subrubro+'. MIPER declarada: '+(e.tiene_iper||'no especificado')+'.\n'+
      'Ítem 3: ¿La MIPER considera exposición a todos los agentes y factores de riesgo: ergonómicos, psicosociales, violencia y acoso, accidentes/EP producidos, programas de vigilancia, con enfoque de género? (Art.7 inc.2). '+
      'Agentes declarados: sustancias='+e.sustancias+', ruido='+e.ruido+', polvo='+e.polvo+', temperatura='+e.temperatura+', vibraciones='+e.vibracion+', biológico='+e.biologico+', radiación='+e.radiacion+'. Mujeres: '+(e.mujeres||0)+'.\n'+
      'Ítem 4: ¿La MIPER está disponible en los lugares de trabajo e informada a trabajadores, CPHS/Delegado SST, dirigentes sindicales y toda la línea de mando? (Art.7 inc.9). Verificar acceso físico/digital y registro de difusión.\n'+
      'Ítem 5: ¿La MIPER contiene los elementos mínimos: a) identificación de peligros del puesto; b) evaluación de riesgos; c) magnitud o nivel de riesgo; d) medidas preventivas de control y de emergencias adicionales? (Art.7 inc.3). Verificar que la matriz use metodología VEP (Valor Esperado de la Pérdida, Guía ISP v3 2024 Res.Ex. E668/25, vigente 01-feb-2025): columnas P, S, VEP=P×S y nivel de riesgo (Trivial/Tolerable/Moderado/Importante/Intolerable).\n'+
      'Ítem 6: ¿La MIPER tiene fecha de elaboración y es revisada al menos anualmente o cuando cambien condiciones de trabajo, ocurra un accidente del trabajo, se diagnostique EP o se genere riesgo grave e inminente? (Art.7 inc.9, Art.64 inc.2). Accidentes últimos 12 meses: '+(e.accidentes||'ninguno declarado')+'.\n'+
      'Ítem 7: ¿La entidad empleadora de hasta 25 trabajadores identifica y evalúa sus condiciones ambientales, psicosociales y ergonómicas y el cumplimiento normativo con el instrumento de autoevaluación del OA? (Art.64 inc.1). '+
      (nt<=25?'APLICA — '+nt+' trabajadores. OA: '+e.mutualidad+'. Verificar si se aplicó instrumento de autoevaluación.':'NO APLICA — '+nt+' trabajadores > 25.')+'\n\n'+

      '--- SECCIÓN 3: PROGRAMA DE TRABAJO PREVENTIVO (Art.8) ---\n'+
      'Ítem 8: ¿La entidad empleadora cuenta con programa de trabajo preventivo confeccionado o actualizado a partir de la MIPER, en un plazo de 30 días corridos desde la confección o actualización de la MIPER? (Art.8 inc.1). Verificar existencia y fecha del programa preventivo.\n'+
      'Ítem 9: ¿El programa de trabajo preventivo está por escrito y aprobado por el representante legal? (Art.8 inc.1). Verificar firma de '+e.rep_nombre+', '+e.rep_cargo+'.\n'+
      'Ítem 10: ¿El programa de trabajo preventivo contiene: a) medidas preventivas y correctivas según MIPER; b) plazos de implementación; c) responsables; d) actividades para prevenir consumo alcohol y drogas; e) difusión estilo de vida y alimentación saludable; f) actividades para prevenir riesgos de conducción de vehículos motorizados'+
      (e.trab_vehiculos!=='No'?' (APLICA: '+e.trab_vehiculos+')':'')+'; g) fechas de modificaciones y aprobación? (Art.8 inc.1,2,3).\n'+
      'Ítem 11: ¿El programa de trabajo preventivo ha sido difundido en los lugares de trabajo a los trabajadores y remitido al CPHS? (Art.8 inc.3). '+
      (nt>=25?'APLICA — verificar remisión al CPHS':'Verificar difusión a los '+nt+' trabajadores.')+'\n\n'+

      '--- SECCIÓN 4: USO DE MÁQUINAS, EPP Y MEDIDAS CONTROL (Art.10-14) ---\n'+
      'Ítem 12: En relación con el uso de máquinas, equipos y elementos de trabajo: a) ¿Se informa sobre sus riesgos y manejo adecuado y seguro? b) ¿Se informa sobre el contenido sustancial de manuales e instrucciones? c) ¿Cuenta con procedimiento de trabajo seguro (PTS)? d) ¿Se informa y capacita sobre uso correcto y seguro? (Art.10 inc.1,2). '+
      'Equipos declarados: '+(e.maquinaria||'no especificado')+'. Vehículos: '+e.trab_vehiculos+'. Equipos presión: '+e.trab_presion+'.\n'+
      'Ítem 13: ¿Se adoptan medidas de prevención según prelación, privilegiando protección colectiva por sobre EPP? (Art.12). Verificar jerarquía de controles: eliminación → sustitución → ingeniería → administrativos → EPP.\n'+
      'Ítem 14: Ante riesgo residual, ¿se proporciona EPP libres de costo a los trabajadores? (Art.13 inc.1). Registro de entrega EPP declarado: '+(e.registro_epp||'no especificado')+'.\n'+
      'Ítem 15: ¿Los EPP son adecuados al riesgo a cubrir? (Art.13 inc.1). Verificar concordancia entre riesgos de '+e.rubro+' y EPP entregados. Riesgos principales: '+(e.sustancias!=='Ninguna'?'exposición química ('+e.sustancias+')':'')+
      (e.trab_altura!=='No'?', trabajo en altura':'')+
      (e.trab_vehiculos!=='No'?', conducción vehículos':'')+'.\n'+
      'Ítem 16: ¿Los EPP cumplen normas vigentes de certificación de calidad o están registrados en el ISP? (Art.13 inc.2). Verificar certificaciones NCh/ISP de EPP utilizados en '+e.rubro+'.\n'+
      'Ítem 17: ¿Cuenta con procedimiento que considere la utilización, mantenimiento, reposición o recambio de los EPP? (Art.13 inc.2). Verificar existencia de procedimiento escrito de gestión de EPP.\n'+
      'Ítem 18: ¿Los trabajadores están capacitados sobre el uso y mantención de los EPP? Nota: curso mínimo 1 hora que considere partes del EPP, colocación, limitaciones, limpieza, almacenamiento y chequeo diario. (Art.13 inc.3). Capacitaciones declaradas: '+(e.capacitaciones||'no especificado')+'.\n'+
      'Ítem 19: ¿Cuenta con registro de actividades de capacitación en EPP? Nota: el registro debe considerar: a) actividades teóricas y prácticas; b) asistentes; c) relatores; d) resultados de evaluaciones de aprendizaje; e) actividades de reforzamiento. (Art.13 inc.4).\n'+
      'Ítem 20: ¿Se realiza al menos anualmente una evaluación del cumplimiento del programa de trabajo preventivo, especialmente la eficacia de las acciones programadas, y se disponen medidas de mejora continua? (Art.14, Art.52).\n\n'+

      '--- SECCIÓN 5: INFORMACIÓN Y FORMACIÓN EN SST (Art.15-16) ---\n'+
      'Ítem 21: ¿Se informa a los trabajadores los riesgos de sus labores, medidas preventivas y métodos de trabajo correctos, de forma: a) oportuna y adecuada; b) previa al inicio de labores y cada vez que exista nuevo proceso, cambio de tecnología, materiales o sustancias? (Art.15 inc.1). '+
      'Verificar proceso Derecho a Saber para cargos: '+e.cargos+'.\n'+
      'Ítem 22: ¿La información de riesgos entregada a trabajadores considera: a) características mínimas del lugar de trabajo; b) riesgos de exposición y medidas preventivas, incluidos derivados de emergencias/catástrofes; c) procedimientos de trabajo seguro; d) características de productos y sustancias ('+e.sustancias+'); e) riesgos de emergencias del Plan de Gestión y procedimiento de evacuación? (Art.15 inc.3, Art.19 inc.1).\n'+
      'Ítem 23: ¿Se efectuó capacitación teórica o práctica en SST a los trabajadores, y esta: a) fue realizada con la periodicidad del programa preventivo (no exceder 2 años); b) contiene principales medidas de SST; c) considera enfoque de género; d) tiene duración mínima 8 horas, preferentemente dentro de la jornada; e) considera metodologías de aprendizaje adecuadas? (Art.16 inc.1). '+
      'Capacitación declarada: '+(e.capacitaciones||'no especificado')+'. Trabajadores: '+nt+' ('+e.mujeres+' mujeres).\n'+
      'Ítem 24: ¿La capacitación aborda los siguientes temas: a) factores de riesgo del lugar de trabajo ('+e.rubro+'); b) efectos en la salud por exposición a factores de riesgo/EP; c) medidas preventivas de control; d) prestaciones médicas y económicas que tiene derecho el trabajador; e) establecimiento asistencial del OA ('+e.mutualidad+') al que concurrir en caso de AT/EP; f) plan de gestión de riesgos de emergencia; g) señalética en los lugares de trabajo; h) prevención de riesgos de incendio? (Art.16 inc.1).\n\n'+

      '--- SECCIÓN 6: CONSULTA Y PARTICIPACIÓN (Art.17) ---\n'+
      'Ítem 25: ¿Se promueve la consulta y participación de los representantes de los trabajadores en la gestión preventiva? Notas: se consulta al CPHS ante cambios en procesos de trabajo; el empleador promueve participación de trabajadores y representantes en investigación de AT/EP. (Art.17 inc.1, Art.37 inc.2 numeral 4, Art.71 inc.1). '+
      (nt<10?'EMPRESA <10 TRABAJADORES: verificar mecanismo de participación directa (asambleas mensuales, canal de comunicación) que reemplaza al CPHS.':nt<25?'EMPRESA 10-24: verificar participación del Delegado SST.':'EMPRESA ≥25: verificar consulta al CPHS.')+'\n\n'+

      '--- SECCIÓN 6B: RIESGO GRAVE E INMINENTE Y PLAN EMERGENCIAS (Art.18-19) ---\n'+
      'Ítem 26: ¿La entidad empleadora ante un riesgo grave e inminente realizó: a) informar inmediatamente a trabajadores sobre el riesgo y medidas adoptadas; b) adoptar medidas para suspensión inmediata de faenas y evacuación si el riesgo no puede eliminarse o atenuarse? (Art.18 inc.1). Verificar existencia de procedimiento ante RGI.\n'+
      'Ítem 27: ¿Se cuenta con uno o más planes de gestión, reducción y respuesta de riesgos en caso de emergencias, catástrofes o desastres u otros eventos conocidos, probables y previsibles de naturaleza interna o externa? (Art.19 inc.1). Plan de emergencia declarado: '+(e.extintores!=='No'?'extintores presentes':'sin extintores')+', alarma: '+e.alarma+', botiquín: '+e.botiquin+'. Riesgos específicos del rubro: '+
      (e.sustancias!=='Ninguna'?'derrame/intoxicación '+e.sustancias+'; ':'')+
      (e.trab_presion!=='No'?'falla equipo a presión; ':'')+
      (e.trab_confinado!=='No'?'accidente espacio confinado; ':'')+'incendio, sismo.\n'+
      'Ítem 28: ¿Se realiza al menos una vez al año pruebas de ensayo (simulacros) del o los planes de gestión, reducción y respuesta frente a riesgos de emergencias, catástrofes o desastres u otros eventos conocidos? (Art.19 inc.1). Verificar registro de simulacros realizados.\n\n'+
      'Al terminar escribe exactamente: ===FUF_P1FIN===';
    var p2 = I+'\nFUF DS 44/2024 PARTE 2 — Ítems 29 al 60 + Resumen Ejecutivo para:\n\n'+base+'\n\nFecha: '+fecha+'.\n\n'+
      'INSTRUCCIÓN: Evalúa EXACTAMENTE los siguientes 32 ítems del FUF oficial. Para cada ítem indica CUMPLE / NO CUMPLE / NO APLICA con justificación específica basada en los datos reales del cliente. NO omitas ningún ítem.\n\n'+
      '--- SECCIÓN 7: COORDINACIÓN (Art.20) ---\n'+
      'Ítem 29: ¿Existe coordinación, cooperación e información mutua cuando presten servicios más de una entidad empleadora en el mismo lugar de trabajo? (Art.20 inc.1). '+(e.lugar_trabajo&&e.lugar_trabajo.indexOf('cliente')>=0?'ALERTA: '+e.razon+' trabaja en instalaciones de clientes — verificar acuerdos formales con empresa principal.':'Verificar si trabajan junto a otras empresas.')+'\n\n'+
      '--- SECCIÓN 8: COMITÉS PARITARIOS (Art.23-66) ---\n'+
      'Nota dotación: '+nt+' trabajadores → '+cphs_txt+'\n'+
      'Ítem 30: ¿Se encuentra constituido el CPHS en empresa/faena con más de 25 personas? (Art.23 inc.1). '+(nt>=25?'APLICA — verificar constitución':'NO APLICA — '+nt+' trabajadores < 25')+'\n'+
      'Ítem 31: ¿Los integrantes del CPHS sin curso de orientación lo realizan en primer semestre? (Art.32 inc.1). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 32: ¿Se registró acta de constitución en web DT dentro de 15 días hábiles? (Art.36). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 33: ¿El empleador otorga facilidades para el funcionamiento del CPHS? (Art.37). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 34: ¿El CPHS efectúa reuniones mensuales ordinarias y extraordinarias ante accidente grave o riesgo inminente? (Art.39 inc.1 y 2). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 35: ¿Se cuenta con actas del CPHS con materias tratadas, acuerdos y plazos? (Art.39 inc.4, Art.42 inc.1). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 36: ¿Los acuerdos del CPHS se comunican por escrito al empleador? (Art.42 inc.2). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 37: ¿Se proporciona toda la documentación preventiva al CPHS? (Art.46 inc.3). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 38: ¿El CPHS cumple funciones mínimas: asesorar EPP, vigilar cumplimiento, investigar accidentes, indicar medidas, promover capacitación, informar riesgo grave? (Art.47). '+(nt>=25?'APLICA':'NO APLICA')+'\n'+
      'Ítem 39: ¿En empresas 10-24 trabajadores, cuenta con Delegado SST que participe en SGSST? (Art.66 inc.1, Art.64, Art.37). '+(nt>=10&&nt<25?'APLICA — '+nt+' trabajadores requiere Delegado SST':nt<10?'NO APLICA — '+nt+' trabajadores < 10':'NO APLICA — tiene CPHS')+'\n'+
      'Ítem 40: ¿El Delegado SST es elegido cada 2 años mediante asamblea con acta? (Art.66 inc.2). '+(nt>=10&&nt<25?'APLICA':'NO APLICA')+'\n\n'+
      '--- SECCIÓN 9: DEPARTAMENTO PREVENCIÓN RIESGOS (Art.50-65) ---\n'+
      'Ítem 41: ¿Cuenta con DPR si tiene más de 100 trabajadores, dirigido por experto inscrito en SEREMI? (Art.50, Art.55 inc.2). '+(nt>100?'APLICA':'NO APLICA — '+nt+' trabajadores < 100')+'\n'+
      'Ítem 42: ¿Se proporciona al DPR todos los medios y personal necesario? (Art.51 inc.1). '+(nt>100?'APLICA':'NO APLICA')+'\n'+
      'Ítem 43: ¿El DPR cumple sus funciones? (Art.52). '+(nt>100?'APLICA':'NO APLICA')+'\n'+
      'Ítem 44: ¿Categoría y tiempo de dedicación del DPR se determina según dotación y cotización? (Art.54, Art.55 inc.1). '+(nt>100?'APLICA':'NO APLICA')+'\n'+
      'Ítem 45: ¿El encargado DPR registra asistencia conforme al tiempo definido? (Art.55 inc.1 y 3). '+(nt>100?'APLICA':'NO APLICA')+'\n'+
      'Ítem 46: ¿El DPR mantiene registros de incidentes, accidentes trabajo/trayecto/EP, vigilancia salud, tasas accidentabilidad/frecuencia/gravedad diferenciadas por sexo? (Art.73, Art.74). '+(nt>100?'APLICA':'NO APLICA')+'\n'+
      'Ítem 47: ¿Sin DPR obligatorio, registra tasa anual accidentabilidad, accidentes del trabajo/trayecto y EP? (Art.75). '+(nt<=100?'APLICA — verificar si '+e.razon+' mantiene estos registros':'NO APLICA')+'\n'+
      'Ítem 48: ¿Si tiene hasta 100 trabajadores y designó encargado de Gestión del Riesgo, fue capacitado por el OA? (Art.65 inc.1). '+(nt<=100?'APLICA si hay encargado designado — verificar':'NO APLICA')+'\n\n'+
      '--- SECCIÓN 10: REGLAMENTO INTERNO (Art.56-58) ---\n'+
      'Ítem 49: ¿Cuenta y mantiene al día un RIHS, entregado gratuitamente a trabajadores e ingresado a web DT? (Art.56 inc.1, Art.57 inc.1). RIOHS declarado por cliente: '+(e.tiene_riohs||'no especificado')+'. Verificar ingreso en plataforma web DT.\n'+
      'Ítem 50: ¿El RI se envía con 30 días de anticipación a trabajadores, CPHS/Delegado SST y sindicatos? (Art.57 inc.2). Verificar procedimiento de comunicación previa.\n'+
      'Ítem 51: ¿Se revisa el RI con periodicidad no inferior a un año con participación de DPR, CPHS/Delegado y sindicatos? (Art.57 inc.5). Verificar revisión anual documentada.\n'+
      'Ítem 52: ¿El RI contiene como mínimo: preámbulo, disposiciones generales, obligaciones, prohibiciones y sanciones? (Art.58). Verificar estructura completa.\n\n'+
      '--- SECCIÓN 11: MAPAS DE RIESGO (Art.62) ---\n'+
      'Ítem 53: ¿Mantiene mapas de riesgo visibles en dependencias con dibujo/esquema del lugar e indicación de principales riesgos? (Art.62 inc.1 y 2). Verificar presencia física en instalaciones de '+e.razon+'.\n\n'+
      '--- SECCIÓN 12: VIGILANCIA AMBIENTE Y SALUD (Art.67-68) ---\n'+
      'Ítem 54: ¿Los lugares de trabajo con exposición a agentes de riesgo están en programa de vigilancia ambiental conforme protocolos MINSAL y OA? (Art.67 inc.1,3). Agentes declarados: '+(e.sustancias||'no especificado')+', ruido: '+(e.ruido||'no especificado')+'.\n'+
      'Ítem 55: ¿Los trabajadores expuestos a agentes de riesgo están en programa de vigilancia a la salud conforme protocolos MINSAL y OA? (Art.67 inc.1,3,5). Verificar protocolos aplicables al rubro '+(e.rubro||'')+'.\n'+
      'Ítem 56: ¿El empleador autoriza asistir a citaciones para exámenes del OA considerando ese tiempo como trabajado? (Art.68). Verificar procedimiento interno.\n\n'+
      '--- SECCIÓN 13: TRASLADO Y PRESCRIPCIÓN (Art.69-70) ---\n'+
      'Ítem 57: ¿El trabajador afectado por EP fue trasladado a puesto sin exposición al riesgo causante, sin detrimento de remuneraciones? (Art.69). Verificar si ha habido EP diagnosticadas.\n'+
      'Ítem 58: ¿El empleador implementa medidas ordenadas por fiscalizadores, OA, DPR o CPHS? (Art.70). Verificar prescripciones pendientes.\n\n'+
      '--- SECCIÓN 14: INVESTIGACIÓN ACCIDENTES (Art.71) ---\n'+
      'Ítem 59: ¿El empleador investiga con enfoque de género las causas de accidentes del trabajo y EP, usando metodología del OA? (Art.71). Accidentes últimos 12 meses: '+(e.accidentes||'ninguno declarado')+'.\n\n'+
      '--- SECCIÓN 15: REGISTRO ACTIVIDAD PREVENTIVA (Art.72) ---\n'+
      'Ítem 60: ¿El empleador registra y respalda documentalmente toda la información de gestión de riesgos y la mantiene disponible para fiscalizadores y OA? (Art.72 inc.1). Verificar archivo de documentación preventiva.\n\n'+
      '---\nRESUMEN EJECUTIVO FUF DS 44/2024\n---\n'+
      'CONTEO TOTAL (sobre 60 ítems): Cumple: X | No Cumple: X | No Aplica: X\n'+
      'NIVEL RIESGO LEGAL: ALTO si >10 NC / MEDIO si 5-10 NC / BAJO si <5 NC\n'+
      'MULTA ESTIMADA: Entre X y X UTM (CT Art.154 N°7 — 1 UTM ≈ $68.000 jun-2026)\n'+
      'TOP 5 INCUMPLIMIENTOS CRÍTICOS:\n'+
      '1. Ítem N° — descripción — plazo recomendado\n'+
      '2. Ítem N° — descripción — plazo recomendado\n'+
      '3. Ítem N° — descripción — plazo recomendado\n'+
      '4. Ítem N° — descripción — plazo recomendado\n'+
      '5. Ítem N° — descripción — plazo recomendado\n'+
      'PLAN DE ACCIÓN INMEDIATA: pasos prioritarios en orden cronológico.\n'+
      'Elaborado por: Alan Bascur Montenegro | Ing. Prevención de Riesgos | RUT 17.658.387-8 | Plus Control SpA | Fecha: '+fecha+'.';
    return p1+'\n\n===FUF_INTERMEDIO===\n\n'+p2;
  }

  if(tipo==='karin') return I+'\nElabora PROTOCOLO COMPLETO LEY KARIN (Ley 21.643 + DS 2/2024 MINTRAB) para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    '## PROTOCOLO DE PREVENCIÓN Y SANCIÓN DE VIOLENCIA LABORAL\n'+
    '### Ley 21.643 vigente desde agosto 2024 + DS 2/2024 MINTRAB\n\n'+
    'Art.1 ÁMBITO: aplica a toda relación laboral de '+e.razon+', entre trabajadores, con clientes, proveedores y público.\n'+
    'Art.2 DEFINICIONES LEGALES PRECISAS (fuente: dt.gob.cl, modificadas por Ley 21.643 vigente agosto 2024):\nACOSO LABORAL (CT Art.2° inc.2° letra b): Conductas constitutivas de acoso laboral según la DT (fuente oficial dt.gob.cl): (1) violencia física sobre el trabajador o sus pertenencias; (2) intimidación, amenazas y conductas de violencia psicológica; (3) obligar a ejecutar tareas en contra de la conciencia del trabajador; (4) juzgar el desempeño del trabajador de manera ofensiva; (5) cuestionar injustificadamente decisiones del trabajador; (6) no asignar tareas, asignar tareas sin sentido, asignar tareas muy por debajo de las capacidades o sobrecargar de tareas; (7) aislar o ignorar al trabajador; (8) gritos y gestos agresivos o intimidatorios; (9) creación de ambiente de trabajo hostil y ofensivo. IMPORTANTE: basta UNA SOLA conducta grave para configurar acoso laboral (CT Art.2° inc.2° letra b) modificado por Ley 21.643 — eliminó el requisito de reiteración).\nACOSO SEXUAL (CT Art.2° inc.2° letra a): Conductas constitutivas de acoso sexual según la DT (fuente oficial dt.gob.cl): toda conducta realizada de forma indebida y por cualquier medio que implique requerimientos (imposiciones, exigencias, invitaciones, etc.) de carácter sexual por una persona contra otra que no consiente, y que amenacen o perjudiquen su situación laboral o sus oportunidades en el empleo (CT Art.2° inc.2° letra a), modificado por Ley 21.643). Incluye: insinuaciones verbales, comentarios de connotación sexual, mensajes digitales, contacto físico no consentido, exhibición de material sexual, promesas de beneficios laborales condicionadas a favores sexuales, amenazas ante negativa.\nVIOLENCIA POR TERCEROS (CT Art.2° inc.2° letra c): Violencia ejercida por terceros según la DT (fuente oficial dt.gob.cl): cualquier conducta dañina ejercida por personas ajenas a la empresa — clientes, proveedores, usuarios u otros — que afecte a las y los trabajadores CON OCASIÓN de la prestación de sus servicios, sea dentro o fuera del lugar de trabajo (CT Art.2° inc.2° letra c) modificado por Ley 21.643). Incluye: agresiones físicas, intimidación, amenazas verbales o escritas, insultos y trato denigrante.\nVIOLENCIA POR RAZÓN DE GÉNERO: violencia dirigida contra personas por su sexo o género, incluye acoso sexual.\n'+
    'Art.3 MEDIDAS PREVENTIVAS: identificación factores riesgo, capacitación anual (incluir en programa '+new Date().getFullYear()+'), evaluación clima laboral.\n'+
    'Art.4 CANAL DENUNCIA INTERNO: el responsable NOMINADO para recibir denuncias es '+e.rep_nombre+', '+e.rep_cargo+' (este nombre debe aparecer textualmente en el documento, conforme Ley 21.643). Formulario escrito o verbal. Plazo acuse recibo: 2 días hábiles.\n'+
    'Art.5 MEDIDAS CAUTELARES INMEDIATAS (máx. 5 días desde denuncia): separación física, redistribución horaria, otras medidas según caso.\n'+
    'Art.6 PROCEDIMIENTO INVESTIGACIÓN: designación investigador imparcial (3 días). IMPORTANTE: En empresas con menos de 10 trabajadores, si no es posible garantizar imparcialidad interna, el empleador DEBE derivar la investigación directamente a la Inspección del Trabajo (Ley 21.643), evitando conflicto de interés. Comunicación a denunciado, descargos y pruebas, informe con conclusiones y medidas (máx. 30 días hábiles).\n'+
    'Art.7 SANCIONES AL INFRACTOR: amonestación escrita → multa hasta 25% remuneración diaria → término contrato Art.160 N°1 CT.\n'+
    'Art.8 PROTECCIÓN DENUNCIANTE: confidencialidad, prohibición absoluta de represalias, no puede ser despedido durante investigación sin autorización DT.\n'+
    'Art.9 CANAL EXTERNO: Inspección del Trabajo (dt.gob.cl / 600 4500 247 / Oficina DT Región de '+e.region+'). Plazo denuncia: 90 días CORRIDOS (calendarios) desde ocurrencia del hecho.\n'+
    'Art.10 REGISTRO Y DIFUSIÓN: libro de denuncias reservado, estadísticas anuales diferenciadas por tipo y género, reporte a '+e.mutualidad+'. Difusión trimestral del protocolo a todos los trabajadores. TABLA ACUSE DE RECIBO obligatoria: Nombre | RUT | Cargo | Fecha | Firma — para cada uno de los '+e.trabajadores+' trabajadores.\n'+
    'Firma: Alan Bascur Montenegro IPR Plus Control SpA. '+e.rep_nombre+', '+e.rep_cargo+'. Fecha: '+fecha+'.';

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
    '\nREGISTROS OBLIGATORIOS (DS 44/2024 Art.16 inc.4):\n'+
    '1. Lista de asistencia: Nombre | RUT | Cargo | Firma — obligatoria en CADA sesión.\n'+
    '2. Evaluación de aprendizaje: nota o porcentaje de respuestas correctas por participante.\n'+
    '3. Certificado de participación: emitido por Plus Control SpA / relator, con horas y contenidos.\n'+
    '4. Registro de actividades de reforzamiento ante evaluación insatisfactoria (<60%).\n'+
    'TABLA PROGRAMA ANUAL: N° | Módulo | Contenido | Horas | Fecha programada | Relator | Participantes | Metodología (presencial/e-learning/taller práctico) | Indicador éxito | Estado (pendiente/realizado/reprogramado).\n'+
    'Firma: Alan Bascur Montenegro IPR Plus Control SpA. '+e.rep_nombre+', '+e.rep_cargo+'. Fecha: '+fecha+'.';

  if(tipo==='derechosaber') return I+'\nElabora DOCUMENTO DERECHO A SABER (DS 44/2024 Arts.14-15 + DS 40/1969 Art.21) para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    'FUNDAMENTO LEGAL — 3 ELEMENTOS OBLIGATORIOS (DS 44/2024 Art.15): el empleador debe informar a CADA trabajador ANTES de iniciar labores: '+
    '(1) riesgos específicos de su puesto; (2) medidas preventivas y de control; (3) métodos de trabajo correctos. '+
    'La DT define método de trabajo seguro (DS 40/1969 Art.21, fuente: dt.gob.cl) como: el modo de obrar o proceder en el trabajo, indicando CADA PASO a seguir y las medidas de seguridad a adoptar. '+
    'Esto equivale a un Procedimiento de Trabajo Seguro (PTS). Omitir cualquiera de los 3 elementos es infracción fiscalizable por la DT.\n\n'+
    'TABLA DERECHO A SABER — una fila por cargo real (cargos: '+(e.cargos||'Ver ficha de cargos de la empresa')+'):\n'+
    'Columnas: N°|Cargo/Puesto|Tipo actividad (R=Rutinaria / NR=No rutinaria)|Tarea específica|Peligro — Fuente o Situación (origen físico)|Peligro — Acto o condición insegura (comportamiento que activa el riesgo)|Tipo peligro (seguridad/higiénico/ergonómico/psicosocial)|Incidente potencial / Consecuencia|P (1-5)|S (1-5)|VEP=P×S|Nivel riesgo (Trivial/Tolerable/Moderado/Importante/Intolerable)|Medida preventiva según jerarquía ISP (Eliminación→Sustitución→Ingeniería→Administrativo→EPP)|EPP obligatorio con norma NCh|Método de trabajo seguro / PTS asociado (nombre del PTS o pasos clave)|Normativa aplicable.\n\n'+
    'Mínimo 10 registros con datos REALES de '+e.subrubro+'. Incluir actividades rutinarias Y no rutinarias (mantenimiento, emergencias, tareas esporádicas). '+
    'Separar siempre Fuente/Situación del Acto en columnas distintas.\n'+
    (e.sustancias&&e.sustancias!=='Ninguna'?'INSTRUCCIÓN ESPECIAL PARA SUSTANCIAS QUÍMICAS (DS 40/1969 Art.21 inc.2, ACHS): para cada sustancia declarada ('+e.sustancias+'), la columna de peligro debe incluir: (a) fórmula o nombre técnico, sinónimos, aspecto y olor según HDS (Hoja de Datos de Seguridad); (b) límites de exposición permisibles (valores LP según DS 594/1999 MINSAL); (c) peligros específicos para la salud (vía inhalatoria, dérmica, ocular); (d) medidas de control y prevención específicas de esa sustancia. La HDS de cada producto debe estar disponible en el lugar de trabajo y ser parte del proceso de inducción del trabajador. Si el cliente no tiene HDS, indicar en el documento como NO CUMPLE — obtener HDS del proveedor es obligación del empleador (DS 594/1999 Art.37).\n':'')+
    '\n'+
    'FORMULARIO DE ACUSE DE RECIBO — replicar para cada uno de los '+e.trabajadores+' trabajadores:\n'+
    'Datos: Nombre completo | RUT | Cargo | Fecha inicio labores | Área.\n'+
    'El trabajador declara haber recibido: (1) información sobre riesgos de su puesto; (2) información sobre medidas preventivas; (3) información sobre métodos de trabajo correctos y seguros (DS 44/2024 Art.15 + DS 40/1969 Art.21); (4) capacitación práctica en uso de EPP.\n'+
    'Firmas: Trabajador | '+e.rep_nombre+' '+e.rep_cargo+' | Fecha.\n'+
    'NOTA LEGAL (DS 44/2024 Art.15, DS 40/1969 Art.23, Dictamen SUSESO 1484/2004): '+
    (nt<25?'Este documento es entregado directamente por el empleador '+e.rep_nombre+', '+e.rep_cargo+', dado que '+e.razon+' tiene '+e.trabajadores+' trabajadores y no cuenta con CPHS ni DPR obligatorio. Conforme al DS 40/1969 Art.23, cuando no existen dichos órganos, el empleador entrega la información en la forma más conveniente y adecuada. ':'Este documento es entregado a través del '+(nt>=25&&nt<=100?'Delegado SST o CPHS ('+nt+' trabajadores)':'CPHS y DPR ('+nt+' trabajadores)')+' conforme DS 40/1969 Art.23. ')+'Entregar al inicio de labores, ante cambio de puesto, nuevas sustancias/tecnologías o procesos, y al menos anualmente. '+'La capacitación en prevención NO puede ser exigida como requisito previo a la contratación — es obligación del empleador (Dictamen SUSESO 1484/2004).\n\n'+
    'Elaborado por: Alan Bascur Montenegro | Ing. Prevención de Riesgos | RUT 17.658.387-8 | Plus Control SpA | Fecha: '+fecha+'.';

  // Plan de Emergencia
  var escenarios_list = ['Incendio en instalaciones o vehículos'];
  if(e.sustancias && e.sustancias!=='Ninguna') escenarios_list.push('Derrame o fuga de sustancias químicas ('+e.sustancias+')');
  if(e.trab_presion && e.trab_presion!=='No') escenarios_list.push('Explosión o fuga de equipo a presión ('+e.trab_presion+')');
  if(e.trab_confinado && e.trab_confinado!=='No') escenarios_list.push('Accidente en espacio confinado');
  if(e.trab_vehiculos && e.trab_vehiculos!=='No') escenarios_list.push('Accidente de tránsito con carga ('+e.trab_vehiculos+')');
  escenarios_list.push('Sismo de gran magnitud');
  escenarios_list.push('Accidente grave o fatal de trabajador');
  escenarios_list.push('Emergencia médica súbita');
  escenarios_list.push('Temporal de lluvia, viento e inundación');
  escenarios_list.push('Robo o asalto en instalaciones o en terreno');
  var escenarios_str = escenarios_list.map(function(s,i){return (i+1)+'. '+s;}).join(' | ');

  return I+'\nElabora PLAN DE EMERGENCIA Y EVACUACIÓN para:\n\n'+base+'\n\nControl: '+ctrl+'\n\n'+
    '--- SECCIÓN 1: OBJETIVO, ALCANCE Y VIGENCIA ---\n'+
    'Art.1 Objetivo general: proteger vida e integridad de '+e.trabajadores+' trabajadores de '+e.razon+'. Fundamento: DS 594/1999 Arts.44-54, DS 44/2024 Art.19, Ley 16.744.\n'+
    'Art.2 Alcance: aplica a instalaciones '+e.direccion+', '+e.ciudad+', Región de '+e.region+
    (e.sucursales_txt?', y sucursales: '+e.sucursales_txt:'')+
    '; vehículos '+e.trab_vehiculos+'; operaciones en terreno; contratistas y visitas.\n'+
    'Art.3 Vigencia: desde '+fecha+' hasta '+new Date(new Date().setFullYear(new Date().getFullYear()+1)).toLocaleDateString('es-CL')+'. Actualizar ante cambios de instalaciones, dotación, procesos o tras emergencia real.\n\n'+
    '--- SECCIÓN 2: DESCRIPCIÓN DE INSTALACIONES Y CROQUIS NARRATIVO ---\n'+
    'Art.4 Características físicas: '+e.superficie+'m² distribuidos en '+e.pisos+' piso(s). Atiende público: '+e.publico+'. Maquinaria y equipos: '+(e.maquinaria||'no especificado')+'. Sustancias almacenadas: '+e.sustancias+'.\n'+
    'Art.4b CROQUIS NARRATIVO DE INSTALACIONES (requerido por ACHS y Bomberos como orientación ante emergencias): '+
    'Elabora una TABLA DESCRIPTIVA de zonas con las siguientes columnas: '+
    'Zona/Área | Piso | Descripción de contenido y actividad | Riesgos específicos de esa zona | Vía de evacuación asignada | Extintor más cercano. '+
    'Basarse en los datos reales del cliente: '+e.superficie+'m², '+e.pisos+' piso(s), rubro '+e.rubro+', actividad '+e.subrubro+
    (e.sucursales_txt?', sedes adicionales: '+e.sucursales_txt:'')+'. '+
    'Incluir todas las zonas relevantes: acceso/recepción, área de trabajo principal, zona de almacenamiento '+
    (e.sustancias!=='Ninguna'?'de '+e.sustancias+' ':'')+
    (e.trab_vehiculos!=='No'?', zona de vehículos/estacionamiento ':'')+
    ', servicios higiénicos, oficina administrativa, y cualquier otra zona del rubro. '+
    'Al final de la tabla agregar NOTA OBLIGATORIA: "El empleador debe elaborar el plano físico o digital de las instalaciones a escala, '+
    'identificando gráficamente todas las zonas, vías de evacuación (flechas verdes), punto de reunión (círculo verde), '+
    'ubicación de extintores (ícono rojo), botiquín (cruz verde) y tablero eléctrico (ícono amarillo), '+
    'conforme NCh 2120/1 señalética de emergencia. Este plano debe exhibirse en lugar visible y entregarse a Bomberos '+
    'ante cualquier emergencia para facilitar las labores de rescate (recomendación ACHS)."\n'+
    'Art.5 Riesgos estructurales y ambientales específicos de '+e.rubro+': incendio, '+(e.sustancias!=='Ninguna'?'fuga/derrame químico ('+e.sustancias+'), ':'')+
    (e.trab_presion!=='No'?'explosión equipo a presión ('+e.trab_presion+'), ':'')+'sismo, colapso estructural, riesgo eléctrico.\n\n'+
    '--- SECCIÓN 2B: VULNERABILIDADES ESPECÍFICAS ---\n'+
    'Art.5b Vulnerabilidades identificadas para '+e.razon+' en '+e.ciudad+', Región de '+e.region+': '+
    'listá y describí mínimo 4 vulnerabilidades reales de la empresa considerando: vías de evacuación (ancho, obstrucciones), '+
    'sistema de alarma ('+e.alarma+'), '+
    'capacitación en emergencias ('+e.primeros_auxilios+'), '+
    (e.sustancias!=='Ninguna'?'almacenamiento de sustancias peligrosas ('+e.sustancias+'), ':'')+
    (e.trab_vehiculos!=='No'?'vehículos con carga peligrosa en vía pública, ':'')+
    'distribución del personal en instalaciones ('+e.superficie+'m², '+e.pisos+' piso(s)).'+
    ' Para cada vulnerabilidad indicar la medida correctiva recomendada y plazo sugerido.\n\n'+
    '--- SECCIÓN 2C: NIVELES DE ALERTA ---\n'+
    'Art.5c Sistema de tres niveles de alerta, basado en plan de emergencias del Servicio de Salud Metropolitano Sur Oriente (referencia técnica)::\n'+
    'ALERTA VERDE (preventiva): cuando existe información de un fenómeno EXTERNO que podría afectar la empresa '+
    '(ej: incendio forestal cercano en Región de '+e.region+', alerta de tsunami emitida por SENAPRED, tormenta eléctrica anunciada, información de corte eléctrico programado, manifestaciones en la zona). '+
    'Acción: el Jefe de Emergencia convoca a los roles asignados a estar atentos y disponibles. Se suspenden permisos de personal clave. Se verifica operatividad de equipos.\n'+
    'ALERTA AMARILLA (evento creciente): cuando un evento INTERNO amenaza crecer en extensión y no puede controlarse con recursos habituales '+
    '(ej: principio de incendio que no se extingue en 60 segundos, fuga de sustancia química sin control, trabajador lesionado grave). '+
    'Acción: activar roles de emergencia, llamar servicios externos, evaluar evacuación parcial, el Jefe de Emergencia asume mando.\n'+
    'ALERTA ROJA (emergencia declarada): cuando el evento crece y amenaza la vida, salud o bienes, más del 50% de la empresa involucrada, o hay víctimas. '+
    'Acción: evacuación total, llamada inmediata Bomberos 132 / SAMU 131 / Carabineros 133, notificar a '+e.mutualidad+' si hay lesionados, Jefe de Emergencia en sesión permanente.\n\n'+
    '--- SECCIÓN 3: ESCENARIOS DE EMERGENCIA ---\n'+
    'ESCENARIOS IDENTIFICADOS PARA ESTE RUBRO/EMPRESA: '+escenarios_str+'\n\n'+
    'Para CADA escenario listado arriba, desarrollar obligatoriamente las 3 fases siguientes:\n\n'+
    escenarios_list.map(function(esc, idx){
      return 'ESCENARIO '+(idx+1)+': '+esc+'\n'+
        'ANTES (prevención y preparación): medidas preventivas específicas para este escenario, inspecciones periódicas, capacitación del personal, verificación de equipos de control.\n'+
        'DURANTE (respuesta inmediata): protocolo paso a paso — quién hace qué en los primeros 5 minutos, cuándo llamar a servicios externos (Bomberos 132 / SAMU 131 / Carabineros 133), cuándo evacuar, restricciones (qué NO hacer).\n'+
        'DESPUÉS (recuperación y documentación): evaluación de daños, informe post-emergencia, notificación a '+e.mutualidad+' si hay lesionados (Ley 16.744 Art.76 — dentro de 24 hrs), medidas correctivas, actualización del plan.';
    }).join('\n\n')+'\n\n'+
    'INSTRUCCIONES ESPECÍFICAS PARA ESCENARIO TEMPORAL/LLUVIA/VIENTO:\n'+
    'ANTES: revisar techumbre y canaletas antes de temporada de lluvias (Región de '+e.region+' — alta pluviometría), asegurar objetos que puedan caer por viento, verificar que vehículos '+(e.trab_vehiculos!=='No'?e.trab_vehiculos:'de la empresa')+' tengan neumáticos en buen estado para rutas mojadas, identificar zonas de inundación en accesos. DURANTE: alejarse de ventanas y objetos que puedan caer, si hay contacto agua-electricidad cortar suministro desde tablero general, evitar conducir en condiciones extremas — postergar servicios en terreno si hay alerta de viento sobre 80 km/h. DESPUÉS: verificar daños en techumbre y estructura antes de reanudar labores, inspeccionar vehículos, reportar daños materiales a empleador y aseguradora.\n\n'+
    'INSTRUCCIONES ESPECÍFICAS PARA ESCENARIO ROBO/ASALTO:\n'+
    'DURANTE: NO oponer resistencia física — la vida del trabajador es lo primero. Obedecer instrucciones del asaltante de forma lenta y calmada. No realizar movimientos bruscos ni acercarse a objetos sin autorización. Observar características del asaltante (contextura, vestimenta, voz) sin ser evidente. Si hay disparos, acostarse en el piso alejado de ventanas. DESPUÉS: llamar a Carabineros 133 apenas sea seguro hacerlo. Notificar inmediatamente al Gerente/empleador. No tocar ni mover objetos del lugar hasta que llegue la policía (preservar evidencias). Brindar apoyo psicológico al trabajador afectado — derivar a psicólogo de '+e.mutualidad+' si hay impacto emocional. Para trabajadores en terreno en instalaciones de clientes: retirarse del lugar de forma segura y comunicar el hecho al empleador. El empleador debe evaluar si continúa prestando servicios en esa instalación.\n\n'+
    (e.alarma==='No' && (e.sustancias!=='Ninguna' || tiene_plaguicidas)?
      'MEDIDAS COMPENSATORIAS POR AUSENCIA DE SISTEMA DE ALARMA: detector de humo autónomo en zona de almacenamiento de '+e.sustancias+'; extintor ABC máx. 15 m de bodega; prohibición fumar y fuentes ignición en radio 10 m; revisión visual al inicio y cierre de jornada; cartilla de emergencia química visible; rondas inspección cada 2 hrs durante jornada.\n\n':'')+
    '--- SECCIÓN 4: ORGANIGRAMA DE EMERGENCIA ---\n'+
    'Art.6 Estructura proporcional a '+e.trabajadores+' trabajadores ('+cphs_txt+'). Cargos reales: '+(e.cargos||'ver ficha de cargos de la empresa')+'.\n'+
    '⚠️ INSTRUCCIÓN CRÍTICA — TABLA NOMINADA OBLIGATORIA: Elaborar una TABLA con nombre completo, cargo y teléfono de cada rol asignado. Con '+e.trabajadores+' trabajadores los roles se distribuyen entre las personas reales de la empresa — una persona puede tener más de un rol. El Representante Legal '+e.rep_nombre+' queda como Jefe de Emergencia titular por defecto. NUNCA dejar celdas en blanco ni usar [NOMBRE] como placeholder — si hay pocos trabajadores, el suplente puede ser la misma persona en otro rol o el Representante Legal.\n'+
    'TABLA ROLES: Rol | Titular (Nombre / Cargo / Teléfono) | Suplente (Nombre / Cargo / Teléfono) | Funciones principales.\n'+
    'Roles mínimos obligatorios:\n'+
    '- Jefe de Emergencia: evalúa magnitud, declara nivel de alerta (Verde/Amarilla/Roja), ordena evacuación, contacta servicios externos, autoriza reingreso, notifica a '+e.mutualidad+' si hay lesionados.\n'+
    '- Coordinador de Evacuación: guía personal por vías señalizadas, barrido de todas las zonas para verificar que no queden personas, conteo nominal en punto de reunión, informa al Jefe.\n'+
    '- Responsable de Primeros Auxilios: atiende lesionados con protocolo ABC, NO administra medicamentos, activa SAMU 131, acompaña al lesionado hasta entrega al servicio médico.\n'+
    '- Responsable de Comunicaciones: llama a Bomberos 132 / SAMU 131 / Carabineros 133, registra hora de cada llamada, informa a familiares previa autorización, mantiene directorio actualizado.\n'+
    (e.trab_vehiculos!=='No'?'- Conductor de emergencia: traslada lesionados a '+e.hospital+' si SAMU no llega en tiempo prudente, conoce ruta más rápida.\n':'')+
    '\n--- SECCIÓN 5: VÍAS DE EVACUACIÓN Y PUNTO DE REUNIÓN ---\n'+
    'Art.7 Vías de evacuación: señalizadas con pictogramas fotoluminiscentes NCh 2120/1, libres de obstáculos permanentemente, ancho mínimo 1,10 m, iluminación de emergencia autónoma 60 min mínimo. Escaleras: superficie antideslizante, pasamanos en ambos lados.\n'+
    'Art.8 Punto de reunión exterior: mínimo 15 m de la edificación, fuera de vías de tráfico, señalizado con círculo verde de 1 m de diámetro (NCh 2120/1), accesible para vehículos de emergencia. Jefe de Emergencia realiza conteo nominal de los '+e.trabajadores+' trabajadores.\n'+
    'Art.8b PLANO DE EVACUACIÓN OBLIGATORIO: El empleador debe elaborar el plano físico o digital de las instalaciones a escala 1:100 o 1:50, identificando: todas las zonas (según croquis narrativo), vías de evacuación con flechas verdes fotoluminiscentes, punto de reunión (círculo verde), ubicación de extintores (ícono rojo NCh 2120/1), botiquín (cruz verde), tablero eléctrico general (ícono amarillo de rayo). El plano debe: (a) imprimirse mínimo en formato A3, plastificado; (b) exhibirse en lugar visible en CADA piso; (c) enviarse en PDF al Cuerpo de Bomberos local; (d) mantenerse copia impresa disponible para entrega al oficial a cargo en emergencia real. La ausencia del plano físico constituye infracción al Art.184 del Código del Trabajo y es observación frecuente en fiscalizaciones DT/SEREMI.\n\ \n'+
    '--- SECCIÓN 6: RECURSOS DE EMERGENCIA ---\n'+
    'Art.9 Extintores: '+e.extintores+'. Distribución conforme NCh 934 Of.2008: distancia máxima 23 m (clase A) / 15 m (clase B). Revisión mensual visual, anual técnica con empresa certificada.\n'+
    'Art.10 Sistema de alarma: '+e.alarma+'.\n'+
    'Art.11 Botiquín de primeros auxilios: '+e.botiquin+'. Inspección mensual, reposición insumos usados dentro de 48 hrs.\n'+
    'Art.12 Personal primeros auxilios: '+(e.primeros_auxilios==='Si'?'Sí, personal capacitado. Mantener certificado vigente con renovación cada 2 años.':'Sin personal capacitado actualmente — PRIORIDAD: capacitar mínimo 2 trabajadores (50% dotación) en curso certificado SENCE mínimo 16 hrs, que incluya RCP, control hemorragias, quemaduras e intoxicaciones. Organismos disponibles: Cruz Roja, ACHS, Mutual de Seguridad, IST.')+'.\n\ \n'+
    '--- SECCIÓN 7: DIRECTORIO DE EMERGENCIAS ---\n'+
    'Bomberos: 132 | SAMU: 131 | Carabineros: 133 | SENAPRED: 1424\n'+
    e.mutualidad+': '+getTelMutualidad(e.mutualidad)+'\n'+
    getSEREMI(e.region)+'\n'+
    (e.sucursales_txt?
      'TABLA POR SEDE (incluir hospital específico más cercano a cada una):\n'+e.sucursales_txt:
      'Hospital/Centro asistencial más cercano: '+(e.hospital||'No especificado')
    )+'\n'+
    'Teléfono empresa: '+e.telefono+'\n\ \n'+
    '--- SECCIÓN 8: PROTOCOLO DE EMERGENCIAS EN OPERACIONES EN TERRENO ---\n'+
    'Art.13 Alcance externo: cuando trabajadores de '+e.razon+' presten servicios en instalaciones de clientes, quedan sujetos tanto a este plan como a los protocolos de emergencia de la empresa receptora.\n'+
    'Art.13b Procedimiento ante emergencia en terreno:\n'+
    '1. DETENER inmediatamente la tarea al detectar la emergencia o activarse la alarma del cliente.\n'+
    '2. SEGUIR las instrucciones del Coordinador de Evacuación de la empresa receptora — no actuar en forma independiente dentro de instalaciones ajenas.\n'+
    '3. EVACUAR al punto de reunión designado por la empresa receptora y reportarse al Jefe de Emergencia de dicho lugar.\n'+
    '4. COMUNICAR al Jefe de Emergencia de '+e.razon+' ('+e.rep_nombre+', tel. '+e.telefono+') dentro de los primeros 10 minutos.\n'+
    '5. Si hay lesionado: activar SAMU 131, NO mover al accidentado salvo riesgo vital inminente, notificar a '+e.mutualidad+' dentro de 24 hrs (Ley 16.744 Art.76).\n'+
    '6. NO reingresar al lugar de trabajo hasta que lo autorice el Jefe de Emergencia de la empresa receptora.\n'+
    '7. REPORTAR el incidente al empleador en el mismo día, por escrito o vía WhatsApp con confirmación de lectura, para inicio de investigación.\n'+
    'Art.13c Trabajadores en ruta (vehículos '+e.trab_vehiculos+'):\n'+
    '- Ante accidente de tránsito: encender baliza, señalizar con triángulo, llamar Carabineros 133, SAMU 131, informar al empleador.\n'+
    '- Ante falla mecánica en ruta: estacionar fuera de la calzada, encender baliza, colocar triángulos reflectantes a 50 m, no permanecer dentro del vehículo si hay tráfico pesado.\n'+
    '- Ante emergencia química en vehículo (si transporta sustancias): alejarse 50 m a favor del viento, llamar Bomberos 132, no intentar controlar el derrame sin EPP adecuado.\n\ \n'+
    '--- SECCIÓN 9: SIMULACROS Y EVALUACIÓN ---\n'+
    'Art.14 Mínimo 1 simulacro anual obligatorio (DS 44/2024 Art.19). Se recomienda 2 anuales para rubro '+e.rubro+'. Programar el próximo para: '+(new Date().getMonth()<6?'segundo semestre '+new Date().getFullYear():'primer semestre '+(new Date().getFullYear()+1))+'.\n'+
    'Tipos: (a) AVISADO — primera vez, para familiarizar al personal; (b) SIN AVISO — una vez internalizado el plan, para evaluar respuesta real.\n'+
    'CRITERIOS DE EVALUACIÓN:\n'+
    '1. Tiempo total de evacuación (desde señal hasta conteo completo en punto de reunión) — meta: <3 min para instalaciones de 1-2 pisos.\n'+
    '2. Cumplimiento de roles: cada rol ejecutó sus funciones según este plan.\n'+
    '3. Comportamiento del personal: orden, ausencia de pánico, cierre de puertas tras el paso.\n'+
    '4. Estado de equipos: extintores accesibles, botiquín disponible, directorio actualizado.\n'+
    '5. Problemas y fallas: identificar causas, proponer correcciones con responsable y plazo.\n'+
    'FORMATO DE REGISTRO OBLIGATORIO (acreditable ante DT/SEREMI):\n'+
    'Tabla: Fecha | Tipo emergencia simulada | Escenario | Duración total | Observaciones por criterio | N° participantes | Firma coordinador.\n'+
    'Lista de asistencia: Nombre | RUT | Cargo | Firma — firmada por CADA uno de los '+e.trabajadores+' trabajadores.\n'+
    'Plan de mejora post-simulacro: Problema observado | Causa | Medida correctiva | Responsable | Plazo | Estado.\n\ \n'+
    '--- SECCIÓN 10: REGISTRO DE ENTREGA Y DIFUSIÓN ---\n'+
    'Art.15 Obligación de difusión (DS 44/2024 Art.19, CT Art.156): este plan debe ser entregado gratuitamente a cada trabajador y comunicado formalmente mediante capacitación específica.\n'+
    'TABLA ACUSE DE RECIBO (completar para cada uno de los '+e.trabajadores+' trabajadores):\n'+
    '| N° | Nombre completo | RUT | Cargo | Fecha recepción | Firma trabajador |\n'+
    '|---|---|---|---|---|---|\n'+
    (Array.from({length: Math.min(parseInt(e.trabajadores)||1, 6)}, function(_,i){ return '| '+(i+1)+' | | | | | |'; }).join('\n'))+'\n'+
    'Firma Empleador: '+e.rep_nombre+' | '+e.rep_cargo+' | Fecha: ___/___/______\n'+
    'Nota: Este registro debe conservarse en archivo de la empresa disponible para fiscalización de DT, SEREMI Salud y '+e.mutualidad+'.\n\ \n'+
    'Normativa: DS 594/1999 Arts.44-54 | DS 44/2024 Art.19 | NCh 934 Of.2008 | NCh 2120/1 señalética.\n'+
    'Elaborado por: Alan Bascur Montenegro | Ing. Prevención de Riesgos | RUT 17.658.387-8 | Plus Control SpA | Fecha: '+fecha+'.';
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
      lbl.textContent='Claude · Parte 1/8 — Preámbulo y Política SST...';
      var r1=await callClaude(buildPrompt(e,'riohs_p1',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 2/8 — Definiciones y Admisión...');
      var r2=await callClaude(buildPrompt(e,'riohs_p2',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 3/8 — Jornada, Obligaciones Empleador y Riesgos...');
      var r3=await callClaude(buildPrompt(e,'riohs_p3',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 4/8 — Obligaciones Trabajadores y Prohibiciones...');
      var r4=await callClaude(buildPrompt(e,'riohs_p4',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 5/8 — Derecho a Saber, EPP y Accidentes...');
      var r5=await callClaude(buildPrompt(e,'riohs_p5',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 6/8 — Psicosocial, Representación y Gestión...');
      var r6=await callClaude(buildPrompt(e,'riohs_p6',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 7/8 — Emergencias, Investigación e Infracciones...');
      var r7=await callClaude(buildPrompt(e,'riohs_p7',normas,rStr,fecha),0,onChunk);
      bannerParte('Claude · Parte 8/8 — Ley Karin, Disposiciones Finales y Firmas...');
      var r8=await callClaude(buildPrompt(e,'riohs_p8',normas,rStr,fecha),0,onChunk);
      texto=r1.replace('===R1FIN===','').trim()+'\n\n'+
            r2.replace('===R2FIN===','').trim()+'\n\n'+
            r3.replace('===R3FIN===','').trim()+'\n\n'+
            r4.replace('===R4FIN===','').trim()+'\n\n'+
            r5.replace('===R5FIN===','').trim()+'\n\n'+
            r6.replace('===R6FIN===','').trim()+'\n\n'+
            r7.replace('===R7FIN===','').trim()+'\n\n'+
            r8;
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
