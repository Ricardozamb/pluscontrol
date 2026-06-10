// ══════════════════════════════════════════════
// PLUS CONTROL — app.js
// Sistema de Prevencion de Riesgos · Chile 2025
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// SISTEMA DE AUTENTICACION PLUS CONTROL
// ══════════════════════════════════════════════

var USUARIOS = {
  'ricardo': { nombre:'Ricardo Zambrano Luna', cargo:'Administrador', rol:'admin', clave:'pluscontrol2025' },
  'alan':    { nombre:'Alan Bascur Montenegro', cargo:'Ingeniero en Prevencion de Riesgos', rol:'iper', clave:'alanbascur2025' }
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


// ── NORMATIVA POR RUBRO (actualizada 2025) ──
var NORM = {
  'Construccion':['DS 44/2024 MINTRAB (vigente 01-feb-2025)','Ley 16.744','DS 594/1999 MINSAL','DS 78/2010 MINTRAB','DS 76/2007 MINTRAB','Ley 20.123','NCh 433 Of.2009','NCh 349 (andamios)','Protocolo TMERT Res.327/2024','Protocolo PREXOR','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Circular SUSESO 3825'],
  'Mineria':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 132/2002 MINMIN','DS 72/1985 MINMIN','Protocolo PREXOR','Protocolo ERA','NCh 2190 explosivos','Convenio OIT 176 ratif.2024','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','DS 76/2007 MINTRAB'],
  'Industria manufacturera':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 76/2007','Ley 20.123','Protocolo PREXOR','Protocolo TMERT Res.327/2024','DS 148/2003 MINSAL','NCh 382 Of.2004','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Agricultura y ganaderia':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 594 Art.103-107 plaguicidas','DS 157/2005 MINSAL','Protocolo ERA','Protocolo TMERT Res.327/2024','Circular SUSESO Olas de Calor 2024','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Pesca y acuicultura':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DFL 292/1953 Ley Navegacion','Protocolo ERA','Protocolo TMERT Res.327/2024','Convenio OIT 188 pesca','NCh 382 Of.2004','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Servicios de salud':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 6/1985 MINSAL','DS 57/2013 MINSAL','Res.283/2007 MINSAL residuos hospitalarios','DS 148/2003 MINSAL','Protocolo ERA biologicos','Protocolo TMERT Res.327/2024','Ley 21.644/2023 violencia en salud','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Transporte y logistica':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Ley 18.290/1984 Transito','DS 212/1992 MINTRANS','NCh 382 Of.2004 mat.peligrosos','DS 298/1994 carga','DS 72/2019 MINTRANS tacografo','Protocolo TMERT Res.327/2024','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Comercio al por menor':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Ley 20.001 cargas manuales','DS 63/2005 MINTRAB','Protocolo TMERT Res.327/2024','DS 1/2009 MINVU accesibilidad','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Comercio al por mayor':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Ley 20.001','DS 63/2005 MINTRAB','NCh 382 Of.2004','DS 148/2003 MINSAL','NCh 934 Of.2008','DS 76/2007','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Gastronomia y restaurantes':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 977/1996 MINSAL Reg.Sanitario Alimentos','DS 594 Art.55-60 cocinas','Ley 20.001','DS 63/2005 MINTRAB','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Saneamiento ambiental':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 157/2005 MINSAL empresas plaguicidas','DS 594 Art.103-107 quimicos','Protocolo ERA','NCh 382 Of.2004','NCh 2245 Of.2003 fichas seguridad','DS 148/2003 MINSAL','Resolucion SEREMI habilitacion sanitaria','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','DS 76/2007'],
  'Proteccion contra incendios':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','NCh 934 Of.2008 extintores','NCh 1433 Of.1977 redes agua','NCh 935 pruebas fuego','NCh 2095 sistemas fijos extincion','DS 594 Art.44-54 prevencion incendios','OGUC Art.4.3','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Silvicultura y forestal':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 4/2013 CONAF incendios forestales','DS 76/2007 MINTRAB','Ley 20.123','Protocolo ERA','Protocolo TMERT Res.327/2024','NCh 382 Of.2004','DS 148/2003 MINSAL','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Servicios de seguridad':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DFL 3607/1981 Vigilancia Privada','DS 93/1985 INTERIOR','DS 1773/1994 INTERIOR armas','Protocolo TMERT Res.327/2024','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Educacion':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 548/1988 MINEDUC establecimientos','DS 1/2009 MINVU accesibilidad','Protocolo TMERT Res.327/2024','Ley 21.643 Ley Karin 2024 esp.relevancia','DS 2/2024 MINTRAB','Ley 20.536 violencia escolar','NCh 934 Of.2008','Ley 21.645/2023'],
  'Hoteleria y turismo':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','DS 977/1996 MINSAL alimentos','DS 222/1980 MINSAL hoteles','Ley 20.001','DS 63/2005 MINTRAB','DS 1/2009 MINVU','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'Tecnologia y comunicaciones':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','Protocolo TMERT Res.327/2024','DS 18/2020 MINTRAB teletrabajo','Ley 21.220/2020 trabajo distancia','DS 1/2009 MINVU','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 21.645/2023'],
  'Energia y utilities':['DS 44/2024 MINTRAB','Ley 16.744','DS 594/1999 MINSAL','NCh Elec.4/2003 instalaciones electricas','DS 76/2007 MINTRAB','Ley 20.123','Protocolo PREXOR','Protocolo ERA','DS 148/2003 MINSAL','NCh 382 Of.2004','NCh 934 Of.2008','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB'],
  'default':['DS 44/2024 MINTRAB (vigente 01-feb-2025)','Ley 16.744','DS 594/1999 MINSAL','Codigo del Trabajo Art.153-157 y 184','Ley 21.643 Ley Karin 2024','DS 2/2024 MINTRAB','Ley 20.123','DS 76/2007 MINTRAB','NCh 934 Of.2008','Circular SUSESO 3825']
};

var RIESGOS_B = {
  'Construccion':['Caida de altura','Golpes con herramientas','Aplastamiento','Exposicion a polvo de silice','Electrocucion','Derrumbe'],
  'Mineria':['Derrumbe de galerias','Exposicion a gases toxicos','Explosion','Caida de rocas','Ruido industrial'],
  'Industria manufacturera':['Atrapamiento en maquinaria','Ruido excesivo','Exposicion a quimicos','Incendio','Sobreesfuerzo fisico'],
  'Agricultura y ganaderia':['Exposicion a plaguicidas','Golpe de calor','Mordeduras de animales','Caidas en terreno','Sobreesfuerzo'],
  'Pesca y acuicultura':['Caida al agua','Hipotermia','Aplastamiento por aparejos','Cortes','Sobreesfuerzo'],
  'Servicios de salud':['Exposicion agentes biologicos','Pinchazo con agujas','Sobreesfuerzo al movilizar pacientes','Estres laboral','Violencia de usuarios'],
  'Saneamiento ambiental':['Intoxicacion por plaguicidas','Exposicion a biocidas','Mordeduras y picaduras','Caidas en espacios confinados'],
  'default':['Caidas al mismo nivel','Sobreesfuerzo fisico','Exposicion a ruido','Incendio','Cortes y heridas','Estres laboral']
};

var TIPO_N = {
  riohs:'Reglamento Interno de Orden, Higiene y Seguridad (RIOHS)',
  iper:'Matriz de Identificacion de Peligros y Evaluacion de Riesgos (IPER)',
  pts:'Procedimiento de Trabajo Seguro (PTS)',
  emergencia:'Plan de Emergencia y Evacuacion'
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
    '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Normativa Chile 2025</div>'+
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
var REQ=['n-razon','n-rut','n-dir','n-ciudad','n-region','n-rep','n-rep-rut','n-rubro','n-trab'];
function resetForm(){
  document.querySelectorAll('#pg-nueva .f-in, #pg-nueva .f-ta').forEach(function(el){el.value='';});
  document.querySelectorAll('#pg-nueva .f-sel').forEach(function(el){el.selectedIndex=0;});
  document.getElementById('riesgos-box').innerHTML='';
  document.getElementById('normas-sec').style.display='none';
  rCnt=0;calcProg();
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
document.getElementById('btn-add-riesgo').addEventListener('click',function(){addRiesgo('');});
document.getElementById('btn-cancelar').addEventListener('click',function(){goTab('dash');});
document.getElementById('btn-guardar').addEventListener('click',function(){
  if(REQ.some(function(id){var el=document.getElementById(id);return !el||!el.value.trim();})){
    alert('Completa los campos obligatorios marcados con *');return;
  }
  var rub=document.getElementById('n-rubro').value;
  emps.push({
    id:Date.now(),
    razon:document.getElementById('n-razon').value.trim(),
    rut:document.getElementById('n-rut').value.trim(),
    direccion:document.getElementById('n-dir').value.trim(),
    ciudad:document.getElementById('n-ciudad').value.trim(),
    region:document.getElementById('n-region').value,
    rubro:rub,
    subrubro:document.getElementById('n-sub').value.trim(),
    trabajadores:parseInt(document.getElementById('n-trab').value),
    mutualidad:document.getElementById('n-mut').value,
    rep_nombre:document.getElementById('n-rep').value.trim(),
    rep_rut:document.getElementById('n-rep-rut').value.trim(),
    rep_cargo:document.getElementById('n-cargo').value.trim(),
    email:document.getElementById('n-email').value.trim(),
    telefono:document.getElementById('n-tel').value.trim(),
    descripcion:document.getElementById('n-desc').value.trim(),
    riesgos:getRiesgos(),
    normativa:NORM[rub]||NORM['default'],
    horario:document.getElementById('n-horario').value.trim()||'Lunes a Viernes 08:00-18:00',
    superficie:document.getElementById('n-superficie').value.trim()||'',
    pisos:document.getElementById('n-pisos').value.trim()||'1',
    maquinaria:document.getElementById('n-maquinaria').value.trim()||'',
    sustancias:document.getElementById('n-sustancias').value.trim()||'Ninguna',
    trab_altura:document.getElementById('n-altura').value||'No',
    trab_caliente:document.getElementById('n-caliente').value||'No',
    trab_confinado:document.getElementById('n-confinado').value||'No',
    trab_vehiculos:document.getElementById('n-vehiculos').value||'No',
    extintores:document.getElementById('n-extintores').value||'No',
    alarma:document.getElementById('n-alarma').value||'No',
    tiene_riohs:document.getElementById('n-tiene-riohs').value||'No',
    tiene_iper:document.getElementById('n-tiene-iper').value||'No',
    capacitaciones:document.getElementById('n-capacitaciones').value||'No',
    registro_epp:document.getElementById('n-registro-epp').value||'No'
  });
  saveData();goTab('dash');
  setTimeout(function(){alert('Empresa guardada exitosamente.');},200);
});

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

['riohs','iper','pts','emergencia','fuf'].forEach(function(t){
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

// ── PROMPTS OPTIMIZADOS (respuesta < 24s) ──
function buildPrompt(e,tipo,normas,rStr,fecha){
  var base='EMPRESA: '+e.razon+' | RUT: '+(e.rut||'---')+' | RUBRO: '+e.rubro+' | TRABAJADORES: '+e.trabajadores+' | CIUDAD: '+e.ciudad+', Region de Los Lagos | REP.LEGAL: '+(e.rep_nombre||'---')+' RUT: '+(e.rep_rut||'---')+' | MUTUALIDAD: '+(e.mutualidad||'---')+' | RIESGOS CRITICOS: '+rStr+' | HORARIO: '+(e.horario||'Lun-Vie 08:00-18:00')+' | INSTALACIONES: Superficie '+(e.superficie||'no indicada')+'m2, '+(e.pisos||'1')+' piso(s) | MAQUINARIA: '+(e.maquinaria||'ver rubro')+' | SUSTANCIAS: '+(e.sustancias||'Ninguna')+' | TRABAJOS ESPECIALES: Altura='+(e.trab_altura||'No')+', Caliente='+(e.trab_caliente||'No')+', Confinado='+(e.trab_confinado||'No')+', Vehiculos='+(e.trab_vehiculos||'No')+' | RECURSOS EMERGENCIA: Extintores='+(e.extintores||'No')+', Alarma='+(e.alarma||'No')+' | DOCS EXISTENTES: RIOHS='+(e.tiene_riohs||'No')+', IPER='+(e.tiene_iper||'No')+', Capacitaciones='+(e.capacitaciones||'No')+', RegistroEPP='+(e.registro_epp||'No');
  var ctrl='CODIGO: PC-'+tipo.toUpperCase()+'-'+new Date().getFullYear()+' | VERSION: 1.0 | FECHA: '+fecha+' | ELABORADO: Alan Bascur Montenegro, Ingeniero en Prevencion de Riesgos, Plus Control SpA | REVISADO: Rep. Legal '+( e.rep_nombre||'empresa');
  var I='INSTRUCCIONES CRITICAS: 1)Cada articulo minimo 3 oraciones completas y concretas, sin espacios vacios. 2)Solo normativa chilena vigente real y verificable. 3)Sin placeholders [nombre][fecha][cargo] - usar datos reales de la empresa. 4)Lenguaje formal tecnico-legal espanol chileno. 5)Documentos listos para fiscalizacion DT, SEREMI Salud y Mutualidad sin correcciones.';

  if(tipo==='riohs_p1')return I+'\n\nElabora RIOHS 2025 PARTE 1 (Capitulos I al VI) para:\n'+base+'\nControl: '+ctrl+'\nNormativa base: DS 44/2024 MINTRAB (vigente 01-feb-2025), Ley 16.744, Ley 21.643 Ley Karin (ago-2024), CT Art.153-157 y 184, DS 594/1999, DS 2/2024.\n\nCAP.I PREAMBULO, VIGENCIA Y POLITICA SST:\nArt.1 Fundamento legal: CT Art.153-157, DS 44/2024, Ley 16.744.\nArt.2 Ambito de aplicacion: a quien aplica, instalaciones, horarios.\nArt.3 Vigencia: fecha inicio vigencia, plazo revision anual.\nArt.4 POLITICA DE SEGURIDAD Y SALUD EN EL TRABAJO (DS 44/2024 Art.22): declaracion compromiso empleador, objetivos SST, responsabilidades, mejora continua. Minimo 8 lineas desarrolladas. FIRMADA por rep.legal.\nArt.5 Difusion obligatoria: entrega gratuita, registro firma trabajadores, ingreso web DT.\n\nCAP.II DEFINICIONES (DS 44/2024 y Ley 21.643):\nArt.6 Definir completamente cada termino: entidad empleadora, persona trabajadora, lugar de trabajo, riesgo laboral, peligro, factor de riesgo, accidente del trabajo, accidente de trayecto, enfermedad profesional, incidente, CPHS, Delegado SST, OAL, EPP, MIPER, medidas preventivas, medidas correctivas, Derecho a Saber, gestion preventiva, violencia en el trabajo, acoso laboral (Ley 21.643: conducta reiterada constituye hostigamiento), acoso sexual (conducta de naturaleza sexual no consentida), violencia en el trabajo, perspectiva de genero.\nMinimo 20 definiciones con desarrollo legal preciso.\n\nCAP.III ADMISION Y CONTRATACION:\nArt.7 Examenes preocupacionales especificos para rubro '+e.rubro+': tipos, entidad realizadora, caracter obligatorio.\nArt.8 Proceso de induccion obligatoria: temas, duracion minima, evaluacion, registro firma.\nArt.9 Documentacion obligatoria: contrato de trabajo, entrega RIOHS firmado, ficha personal.\nArt.10 Restricciones especificas por tipo de puesto en '+e.rubro+'.\n\nCAP.IV JORNADA LABORAL, DESCANSOS Y TURNOS (CT Art.22 y ss):\nArt.11 Jornada ordinaria especifica para rubro '+e.rubro+': horas semanales, distribucion, registros.\nArt.12 Horas extraordinarias: autorizacion escrita, limite legal 2 horas/dia, recargo 50%, registro.\nArt.13 Descansos dentro de jornada y entre jornadas.\nArt.14 Turnos rotativos si aplica al rubro '+e.rubro+'.\nArt.15 Feriados legales, feriado progresivo, feriado proporcional.\nArt.16 Permisos especiales: medicos, maternidad/paternidad, tramites, duelo.\n\nCAP.V OBLIGACIONES DEL EMPLEADOR (DS 44/2024 Art.4-22):\nArt.17 Deber general de proteccion: Art.184 CT y Art.4 DS 44/2024.\nArt.18 SGSST: politica, estructura, diagnostico, evaluacion, mejora continua.\nArt.19 Elaboracion y actualizacion MIPER con enfoque de genero.\nArt.20 Programa de trabajo preventivo derivado de MIPER en 30 dias.\nArt.21 Provision EPP certificados ISP sin costo al trabajador.\nArt.22 Capacitacion obligatoria minimo 8 horas con enfoque genero.\nArt.23 Investigacion accidentes metodologia OAL con enfoque genero.\nArt.24 Registro documental gestion preventiva disponible para fiscalizadores.\nArt.25 Prevencion riesgos psicosociales: protocolo CEAL-SM-SUSESO o instrumento mutualidad.\n\nCAP.VI RIESGOS LABORALES Y MEDIDAS DE CONTROL - especificos rubro '+e.rubro+':\nArt.26 Identificacion de los principales peligros del rubro '+e.rubro+' (minimo 8 peligros reales).\nArt.27 Medidas de control por nivel de jerarquia: eliminacion, sustitucion, controles ingenieria, controles administrativos, EPP.\nArt.28 Riesgos psicosociales especificos del rubro '+e.rubro+': factores, sintomas, medidas.\nArt.29 Riesgos ergonomicos: posturas forzadas, manipulacion manual de carga (DS 63/2005), movimientos repetitivos.\nArt.30 Mapa de riesgos: descripcion de zonas de riesgo del establecimiento, señaletica, vias de evacuacion.\n\nAl terminar escribe exactamente: ===P1FIN===';

  if(tipo==='riohs_p2')return I+'\n\nElabora RIOHS 2025 PARTE 2 (Capitulos VII al XII) para '+e.razon+', rubro '+e.rubro+'. Normativa: '+normas+'. Fecha: '+fecha+'.\n\nCAP.VII OBLIGACIONES DE LOS TRABAJADORES (DS 44/2024 Art.5):\nMinimo 15 articulos completamente desarrollados, especificos para rubro '+e.rubro+'. Incluir obligatorias: conocer y cumplir RIOHS, usar EPP correctamente, informar condiciones inseguras, participar capacitaciones, no presentarse bajo efectos alcohol o drogas, cooperar en investigacion accidentes, participar en simulacros, usar procedimientos de trabajo seguro, reportar accidentes e incidentes.\n\nCAP.VIII PROHIBICIONES ESPECIFICAS:\nMinimo 12 prohibiciones concretas para rubro '+e.rubro+'. Incluir: ingreso con alcohol/drogas, uso celular en areas de riesgo, anular dispositivos de seguridad, trabajar sin EPP en areas de riesgo, acceder a areas restringidas sin autorizacion, realizar trabajos para los que no esta capacitado.\n\nCAP.IX DERECHO A SABER (DS 44/2024 Art.14-15):\nArt. especifico: el empleador debe informar a cada trabajador antes de iniciar labores sobre: riesgos del puesto, medidas preventivas, procedimientos de trabajo seguro, uso EPP, emergencias. Registrar entrega con firma.\nTabla Derecho a Saber especifica para rubro '+e.rubro+': cargo | tarea | peligro | agente | via exposicion | consecuencia | medida control | EPP | normativa. Minimo 8 registros con datos reales del rubro.\n\nCAP.X ELEMENTOS DE PROTECCION PERSONAL:\nArt. lista EPP obligatorio por cargo en '+e.rubro+': cargo | EPP | norma NCh | frecuencia cambio | procedimiento uso | certificacion ISP.\nArt. procedimiento entrega, registro con firma, recambio y mantencio, capacitacion uso (min 1 hora DS 44/2024 Art.13).\n\nCAP.XI ACCIDENTES Y ENFERMEDADES PROFESIONALES (Ley 16.744):\nArt. definicion legal accidente trabajo, trayecto y enfermedad profesional.\nArt. procedimiento ante accidente: primeros auxilios, traslado, notificacion (DIAT dentro 24 horas), investigacion con metodologia '+( e.mutualidad||'OAL')+', medidas correctivas.\nArt. Circular SUSESO N 3825: investigacion con enfoque genero, factores de riesgo psicosocial.\nArt. registro obligatorio: libro de novedades, estadisticas mensuales, tasas accidentabilidad.\nArt. prestaciones Ley 16.744: medicas, economicas, rehabilitacion, derechos del trabajador accidentado.\n\nCAP.XII PREVENCION DE RIESGOS PSICOSOCIALES Y LEY KARIN:\nArt. definicion riesgos psicosociales segun SUSESO: demandas cognitivas, apoyo social, compensaciones, doble presencia.\nArt. instrumento de evaluacion: protocolo CEAL-SM-SUSESO o instrumento de '+( e.mutualidad||'mutualidad')+'.\nArt. ACOSO LABORAL (Ley 21.643 vigente agosto 2024): definicion legal (conducta reiterada que constituye agresion), modalidades, ambito de aplicacion.\nArt. ACOSO SEXUAL: definicion legal, requerimiento no deseado de naturaleza sexual, alcance.\nArt. VIOLENCIA EN EL TRABAJO: violencia externa, interna, por razon de genero.\nArt. protocolo de prevencion: medidas organizacionales, evaluacion periodica, capacitacion.\nArt. canales de denuncia internos: procedimiento, plazos (investigacion max 30 dias habiles), proteccion denunciante.\nArt. procedimiento investigacion: designacion investigador imparcial, etapas, plazos, informe, medidas.\nArt. sanciones para el infractor: amonestacion escrita, multa remuneracional, termino contrato Art.160 N°1 CT.\nArt. garantias: confidencialidad, prohibicion de represalias, proteccion denunciante.\n\nAl terminar escribe exactamente: ===P2FIN===';

  if(tipo==='riohs_p3')return I+'\n\nElabora RIOHS 2025 PARTE 3 (Capitulos XIII al XVII) para '+e.razon+', rubro '+e.rubro+'. Normativa: '+normas+'. Fecha: '+fecha+'.\n\nCAP.XIII COMITE PARITARIO DE HIGIENE Y SEGURIDAD (DS 44/2024 - solo si >= 25 trabajadores):\n'+(e.trabajadores>=25?'Constitucion CPHS obligatoria. Art. composicion: 3 representantes empleador + 3 representantes trabajadores + 3 alternos cada uno. Art. eleccion representantes trabajadores: convocatoria, asamblea, acta, registro DT dentro 15 dias habiles. Art. sesiones ordinarias mensuales y extraordinarias (accidente fatal/grave, RGI, peticion conjunta). Art. actas con materias tratadas, acuerdos, plazos. Art. funciones obligatorias DS 44/2024 Art.47: asesorar EPP, vigilar medidas preventivas, investigar accidentes, indicar medidas seguridad, promover capacitaciones, informar RGI.':'DELEGADO DE SEGURIDAD Y SALUD EN EL TRABAJO (DS 44/2024 Art.66 - empresas 10 a 25 trabajadores): Art. designacion: eleccion por asamblea cada 2 anios, acta. Art. funciones: participar en SGSST, implementar medidas preventivas, representar a trabajadores ante el empleador y OAL. Art. facilidades: tiempo para ejercer funciones sin desmedro remuneracion.')+'\n\nCAP.XIV DEPARTAMENTO PREVENCION RIESGOS (DS 44/2024 - solo si > 100 trabajadores):\n'+(e.trabajadores>100?'DPR obligatorio. Experto a cargo inscrito en registros SEREMI Salud. Funciones DS 44/2024 Art.52. Dedicacion minima segun numero trabajadores y cotizacion generica. Registros obligatorios: incidentes, accidentes, enfermedades, vigilancia salud, estadisticas con perspectiva genero.':'No aplica por tener '+e.trabajadores+' trabajadores (umbral legal es >100).')+'\n\nCAP.XV GESTION PREVENTIVA, PROGRAMA Y CAPACITACION:\nArt. MIPER: elaboracion, enfoque genero, revision anual o ante cambios/accidentes, disponibilidad para trabajadores y CPHS.\nArt. programa de trabajo preventivo: elaboracion en 30 dias desde MIPER, contenido minimo DS 44/2024 Art.8, aprobacion rep.legal, difusion.\nArt. capacitacion minimo 8 horas anuales, con enfoque genero, temas DS 44/2024 Art.16.\nArt. evaluacion anual del cumplimiento del programa preventivo.\nArt. prevencion alcohol y drogas en el lugar de trabajo: politica, procedimiento, consecuencias.\nArt. vigilancia ambiental y de la salud: programas OAL, autorizacion para examenes.\n\nCAP.XVI ORDEN, HIGIENE Y CONDICIONES SANITARIAS (DS 594/1999):\nArt. condiciones generales del lugar de trabajo especificas para '+e.rubro+'.\nArt. servicios higienicos: dotacion segun numero trabajadores y genero (DS 594 Art.25-28).\nArt. agua potable, comedores, vestuarios.\nArt. iluminacion, ventilacion, temperatura segun DS 594.\nArt. almacenamiento de materiales y sustancias especificos para '+e.rubro+'.\nArt. manejo manual de carga (Ley 20.949, DS 63/2005): limites por genero y edad, tecnicas correctas.\n\nCAP.XVII EMERGENCIAS Y EVACUACION:\nArt. plan de emergencia: escenarios especificos para '+e.rubro+', roles y responsabilidades.\nArt. simulacros: frecuencia minima semestral, registro, evaluacion y mejoras.\nArt. equipos contra incendio: extintores (NCh 1433, DS 594 Art.44-54), tipo por clase fuego, ubicacion, revision mensual, recarga anual.\nArt. primeros auxilios: botiquin dotacion minima, persona responsable, comunicaciones de emergencia.\nArt. directorio de emergencias: Bomberos 132, SAMU 131, Carabineros 133, '+( e.mutualidad||'Mutualidad')+', SEREMI Salud Region de Los Lagos.\n\nAl terminar escribe exactamente: ===P3FIN===';

  if(tipo==='riohs_p4')return I+'\n\nElabora RIOHS 2025 PARTE 4 (Capitulos XVIII al XXII + Control Documental) para '+e.razon+', rubro '+e.rubro+'. Normativa: '+normas+'. Fecha: '+fecha+'.\n\nCAP.XVIII INFRACCIONES, SANCIONES Y MULTAS (DS 44/2024 Art.68 y CT Art.154 N7):\nArt. clasificacion infracciones: leves, graves y gravisimas con ejemplos especificos.\nArt. escala de sanciones proporcional: amonestacion verbal, amonestacion escrita, multa (hasta 25% remuneracion diaria por infraccion), termino contrato por causa grave.\nArt. procedimiento sancionatorio: constatacion, comunicacion escrita, plazo descargos (3 dias habiles), resolucion, notificacion.\nArt. infracciones especialmente graves: presentarse bajo efectos alcohol/drogas, no usar EPP en trabajos de alto riesgo, anular dispositivos de seguridad.\nArt. registro de sanciones aplicadas.\n\nCAP.XIX PROCEDIMIENTOS DE DENUNCIA, RECLAMO Y CONSULTA:\nArt. canales internos de denuncia: superior jerarquico, RRHH, correo electronico de la empresa.\nArt. canal externo DT: dt.gob.cl, oficinas DT Osorno (o region correspondiente), fono 600 4500 247.\nArt. canal SUSESO: suseso.cl para materias de Ley 16.744 y Ley 21.643.\nArt. canal SEREMI Salud: materias de higiene y condiciones sanitarias.\nArt. plazos de respuesta interna: max 5 dias habiles para acusar recibo, max 30 dias para resolver.\nArt. proteccion: prohibicion de represalias contra quienes formulen denuncias de buena fe.\n\nCAP.XX VIOLENCIA EN EL TRABAJO Y LEY KARIN - PROTOCOLO COMPLETO (Ley 21.643 vigente agosto 2024):\nArt. AMBITO: aplica a toda la empresa, incluyendo relaciones entre trabajadores, con clientes, proveedores y publico.\nArt. DEFINICIONES LEGALES precisas segun Ley 21.643:\n- Acoso laboral: conducta que constituye agresion u hostigamiento reiterado.\n- Acoso sexual: requerimiento de caracter sexual no consentido que amenace o perjudique situacion laboral.\n- Violencia en el trabajo: actos de violencia fisica, sicologica o sexual ejercidos en el contexto laboral.\n- Violencia por razon de genero.\nArt. MEDIDAS DE PREVENCION: identificacion factores de riesgo, capacitacion anual, evaluacion periodica clima laboral.\nArt. PROTOCOLO DE DENUNCIA: formulario escrito o verbal ante superior jerarquico o directamente a la DT. Plazo: dentro de 90 dias habiles desde el hecho.\nArt. PROCEDIMIENTO INVESTIGACION INTERNA: designacion investigador imparcial dentro 3 dias, comunicacion a denunciado, recepcion descargos y pruebas, informe con conclusiones y medidas dentro 30 dias habiles.\nArt. MEDIDAS CAUTELARES durante investigacion: separacion espacios de trabajo, redistribucion horarios si es necesario.\nArt. SANCIONES AL INFRACTOR: amonestacion escrita, multa hasta 25% remuneracion diaria, termino contrato Art.160 N1 CT.\nArt. PROTECCION DENUNCIANTE: confidencialidad, prohibicion represalias, no puede ser despedido durante investigacion sin autorizacion DT.\nArt. DENUNCIA A DT: si investigacion interna no satisface o hay represalias, trabajador puede denunciar directamente a la Inspeccion del Trabajo.\n\nCAP.XXI DISPOSICIONES GENERALES Y FINALES:\nArt. revision anual del RIOHS con participacion CPHS/Delegado SST y organizaciones sindicales (DS 44/2024 Art.57).\nArt. distribucion obligatoria a cada trabajador de forma gratuita con registro de recepcion.\nArt. ingreso a pagina web Direccion del Trabajo (implica tambien ingreso a SEREMI Salud).\nArt. envio 30 dias antes de vigencia a trabajadores, CPHS, sindicatos para observaciones.\nArt. vigencia: desde '+fecha+' hasta proxima revision.\n\nCAP.XXII CONTROL DOCUMENTAL:\nCodigo: '+ctrl+'\nElaborado por: Alan Bascur Montenegro, Ingeniero en Prevencion de Riesgos Profesionales\nCargo: Profesional Externo de Prevencion de Riesgos - Plus Control SpA\nRegistro Profesional: Inscrito en registros SEREMI de Salud\nFirma y timbre: ___________________\n\nAprobado por: '+( e.rep_nombre||'Representante Legal')+'\nCargo: '+(e.rep_cargo||'Representante Legal')+'\nRUT: '+(e.rep_rut||'---')+'\nFirma: ___________________\n\nFecha de elaboracion: '+fecha+'\nProxima revision: (indicar fecha un anio despues)';

  if(tipo==='iper_p1')return I+'\n\nElabora PARTE 1 MATRIZ IPER DS 44/2024 para:\n'+base+'\n\n1.ENCABEZADO FORMAL:\nEmpresa: '+e.razon+' | RUT: '+(e.rut||'---')+'\nRubro: '+e.rubro+' | Fecha elaboracion: '+fecha+'\nVersion: 1.0 | Codigo: PC-IPER-'+new Date().getFullYear()+'\nElaborado por: Alan Bascur Montenegro, IPR, Plus Control SpA\nMetodologia: Guia Tecnica ISP para IPER en Ambientes de Trabajo (DS 44/2024 Art.7)\n\n2.METODOLOGIA P*C CON ENFOQUE DE GENERO (DS 44/2024 Art.7 inc.2):\nEscala de Probabilidad (1-5): 1=Muy poco probable, 2=Poco probable, 3=Posible, 4=Probable, 5=Muy probable\nEscala de Consecuencia (1-5): 1=Insignificante, 2=Menor (primeros auxilios), 3=Moderado (tratamiento medico), 4=Mayor (incapacidad parcial permanente), 5=Catastrofico (muerte/incapacidad total)\nNiveles riesgo P*C: Trivial(1-4)=verde, Tolerable(5-8)=amarillo, Moderado(9-16)=naranjo, Importante(17-24)=rojo, Intolerable(25)=rojo oscuro\nEnfoque de genero: indicar si el riesgo afecta diferente segun sexo biologico o genero (embarazo, trabajadoras con lactancia, diferencias fisiologicas).\n\n3.PRIMERA MITAD DE AREAS DEL RUBRO '+e.rubro+':\nColumnas obligatorias: N|Area/Proceso|Puesto de Trabajo|Tarea especifica|Peligro real del rubro|Tipo de peligro (fisico/quimico/biologico/ergonomico/psicosocial/mecanico/electrico)|Causa raiz|Consecuencia potencial|N trabajadores expuestos|Genero expuesto|P|C|P*C|Nivel riesgo|Normativa aplicable|Medida control eliminacion|Medida control ingenieria|Medida control administrativo|EPP requerido con norma NCh.\nMinimo 15 registros con peligros REALES del rubro '+e.rubro+'.\n\nAl terminar escribe exactamente: ===IPER1FIN===';

  if(tipo==='iper_p2')return I+'\n\nElabora PARTE 2 MATRIZ IPER DS 44/2024 para '+e.razon+', rubro '+e.rubro+'. Fecha: '+fecha+'.\n\n1.SEGUNDA MITAD AREAS: continuar con las mismas columnas, minimo 15 registros adicionales, peligros REALES del rubro '+e.rubro+'. Incluir obligatoriamente: riesgos ergonomicos (MMC, posturas, movimientos repetitivos), riesgos psicosociales (carga de trabajo, relaciones, autonomia, violencia laboral), riesgos de emergencia.\n\n2.TABLA RIESGOS PSICOSOCIALES (DS 44/2024 Art.7 inc.2 - OBLIGATORIO):\nInstrumento CEAL-SM-SUSESO o instrumento de '+(e.mutualidad||'mutualidad')+': dimensiones evaluadas, nivel de riesgo, medidas control organizacionales.\n\n3.PLAN DE ACCION OBLIGATORIO para riesgos Importantes(17-24) e Intolerables(25):\nColumnas: N|Peligro|Nivel riesgo|Medida correctiva especifica|Responsable cargo real|Plazo dias habiles|Recurso necesario|Indicador de cumplimiento|Fecha seguimiento|Estado.\n\n4.PROGRAMA ACTIVIDADES PREVENTIVAS DS 44/2024 Art.8 (cronograma anual '+new Date().getFullYear()+'):\nMes|Actividad preventiva|Responsable|Participantes|Duracion|Indicador|Observaciones.\nIncluir: capacitaciones, inspecciones, simulacros, evaluaciones, mediciones higienicas si aplica.\n\n5.ESTADISTICAS Y CONTROL (Art.73-75 DS 44/2024):\nIndicadores: tasa accidentabilidad, tasa frecuencia mensual, tasa gravedad semestral. Diferenciados por genero.\n\n6.FIRMAS Y CONTROL DOCUMENTAL:\nAlaborado: Alan Bascur Montenegro, IPR, Plus Control SpA, '+fecha+' | Aprobado: '+(e.rep_nombre||'Rep.Legal')+', '+(e.rep_cargo||'Representante Legal')+' | Proxima revision: (anual o ante cambios).';

  if(tipo==='pts')return I+'\n\nElabora PROCEDIMIENTO DE TRABAJO SEGURO (PTS) para:\n'+base+'\nControl: '+ctrl+'\n\n1.IDENTIFICACION DEL PROCEDIMIENTO:\nNombre: PTS - (indicar tarea principal del rubro '+e.rubro+')\nCodigo: PC-PTS-'+new Date().getFullYear()+' | Version: 1.0 | Fecha: '+fecha+'\n\n2.OBJETO Y ALCANCE ESPECIFICO para rubro '+e.rubro+'.\n\n3.NORMATIVA APLICABLE: '+normas+', DS 63/2005 (MMC), DS 594/1999, normas NCh aplicables.\n\n4.DEFINICIONES TECNICAS del rubro.\n\n5.RESPONSABILIDADES CONCRETAS:\n- Trabajador: cumplir cada paso del procedimiento, usar EPP, reportar condiciones inseguras.\n- Supervisor/Capataz: verificar cumplimiento antes y durante, autorizar inicio trabajo.\n- Empleador: proporcionar EPP, capacitar, actualizar procedimiento ante cambios.\n- CPHS/Delegado SST: revisar y aprobar PTS anualmente.\n\n6.PELIGROS Y RIESGOS ASOCIADOS A LA TAREA en rubro '+e.rubro+' (tabla: peligro|consecuencia|nivel riesgo|control).\n\n7.EPP OBLIGATORIO:\nCargo|EPP|Norma NCh|Certificacion ISP|Uso obligatorio en.\n\n8.PREPARACION ANTES DE INICIAR:\nMinimo 5 pasos: verificacion area, equipos, EPP, autorizaciones, informar a supervisor.\n\n9.PROCEDIMIENTO PASO A PASO (minimo 15 pasos numerados):\nN|Descripcion detallada accion|Peligro asociado al paso|Medida control especifica|Responsable|Punto critico SI/NO.\n\n10.RESTRICCIONES Y PROHIBICIONES ABSOLUTAS para esta tarea.\n\n11.MANEJO DE EMERGENCIAS durante la tarea:\n- Accidente con herido: primeros auxilios, llamar SAMU 131, notificar supervisor, no mover lesionado grave.\n- Incendio: evacuar, llamar Bomberos 132, usar extintor solo si capacitado.\n- Derrames/fugas si aplica al rubro '+e.rubro+'.\n\n12.PREVENCION ALCOHOL Y DROGAS (DS 44/2024 Art.8 inc.2): prohibicion absoluta presentarse bajo efectos, procedimiento ante sospecha.\n\n13.REGISTROS OBLIGATORIOS: acuse recibo firma trabajadores, registro capacitacion, checklist previo a tarea, registro incidentes.\n\n14.ACTUALIZACION: revision ante accidente relacionado, cambio proceso, nueva tecnologia, o anualmente.';

  if(tipo==='fuf'){
    var p1='Eres experto en fiscalizacion laboral chilena. Elabora el FORMULARIO UNICO DE FISCALIZACION (FUF) del DS N 44/2024 completamente diligenciado para:\n'+base+'\n\nINSTRUCCIONES CRITICAS:\n1) Para cada item marca CUMPLE, NO CUMPLE o NO APLICA segun la realidad del rubro '+e.rubro+' y '+e.trabajadores+' trabajadores.\n2) Justifica cada NO CUMPLE con la infraccion especifica y el articulo vulnerado.\n3) Para NO APLICA explica brevemente por que no aplica.\n4) Al final genera RESUMEN EJECUTIVO con: total items cumple/no cumple/no aplica, nivel de riesgo legal (ALTO/MEDIO/BAJO), multas estimadas en UTM, y PLAN DE ACCION PRIORITARIO con los 5 incumplimientos mas criticos a subsanar.\n\nSECCIONES A COMPLETAR (items 1-28):\n\nSECCION 1 SISTEMA GESTION SST (Art.22,64): Item 1 SGSST con politica, estructura, diagnostico, evaluacion, mejora continua.\nSECCION 2 IDENTIFICACION PELIGROS: Item 2 MIPER todos procesos Art.7. Item 3 MIPER incluye riesgos psicosociales/genero Art.7. Item 4 MIPER disponible e informada Art.7. Item 5 MIPER contiene peligros/evaluacion/nivel/controles Art.7. Item 6 MIPER con fecha y revision anual Art.7. Item 7 (<=25 trab) autoevaluacion OAL Art.64.\nSECCION 3 PROGRAMA PREVENTIVO: Item 8 Programa a partir MIPER en 30 dias Art.8. Item 9 Programa escrito y aprobado Art.8. Item 10 Programa contiene medidas/plazos/responsables/AyD/saludable/conduccion Art.8. Item 11 Programa difundido a trabajadores y CPHS Art.8. Item 12 Maquinas/equipos: informacion riesgos, manuales, PTS, capacitacion Art.10. Item 13 Prelacion medidas: colectiva antes EPP Art.12. Item 14 EPP sin costo Art.13. Item 15 EPP adecuado al riesgo Art.13. Item 16 EPP certificado ISP Art.13. Item 17 Procedimiento uso/mantencio/recambio EPP Art.13. Item 18 Capacitacion EPP min 1 hora Art.13. Item 19 Registro capacitacion EPP Art.13. Item 20 Evaluacion anual programa preventivo Art.14.\nSECCION 4 INFORMACION Y FORMACION: Item 21 Informacion riesgos oportuna Art.15. Item 22 Informacion incluye lugar trabajo, riesgos, PTS, sustancias, emergencias Art.15. Item 23 Capacitacion 8 horas con enfoque genero Art.16. Item 24 Capacitacion aborda todos los temas DS 44/2024 Art.16.\nSECCION 5 CONSULTA Y PARTICIPACION: Item 25 Participacion trabajadores gestion preventiva Art.17.\nSECCION 6 RIESGO GRAVE E INMINENTE: Item 26 Ante RGI informacion inmediata y suspension Art.18. Item 27 Plan emergencias Art.19. Item 28 Pruebas anuales plan emergencia Art.19.\n\nAl terminar escribe exactamente: ===FUF_P1FIN===';
    var p2='Continua FUF DS 44/2024 PARTE 2 para '+e.razon+', rubro '+e.rubro+', '+e.trabajadores+' trabajadores. Fecha: '+fecha+'.\n\nSECCION 7 COORDINACION: Item 29 Coordinacion multiples empleadores mismo lugar Art.20.\nSECCION 8 CPHS/DELEGADO SST: Item 30 CPHS constituido si >25 trab Art.23. Item 31 Integrantes CPHS con curso prevencion primer semestre Art.32. Item 32 Acta CPHS registrada DT 15 dias habiles Art.36. Item 33 Facilidades funcionamiento CPHS Art.37. Item 34 Reuniones CPHS mensuales y extraordinarias Art.39. Item 35 Actas con materias/acuerdos/plazos Art.39-42. Item 36 Acuerdos CPHS comunicados por escrito Art.42. Item 37 Documentacion prevencion disponible para CPHS Art.46. Item 38 CPHS cumple funciones minimas Art.47. Item 39 (10-25 trab) Delegado SST elegido Art.66. Item 40 Delegado SST elegido cada 2 anios con acta Art.66.\nSECCION 9 DPR (>100 trab): Item 41 DPR si >100 trab con experto inscrito SEREMI Art.50. Item 42 DPR con medios necesarios Art.51. Item 43 DPR cumple funciones Art.52. Item 44 Categoria DPR segun trab y cotizacion Art.54. Item 45 DPR registra asistencia Art.55. Item 46 DPR mantiene registros con perspectiva genero Art.73-74. Item 47 (sin DPR) registra tasa accidentabilidad/accidentes/EP Art.75. Item 48 (<=100 trab) Encargado gestion riesgo capacitado OAL Art.65.\nSECCION 10 RIOHS: Item 49 RIOHS vigente entregado gratis e ingresado web DT Art.56-57. Item 50 RIOHS enviado 30 dias antes a trab/CPHS/sindicatos Art.57. Item 51 RIOHS revisado anualmente Art.57. Item 52 RIOHS contiene preambulo/disposiciones/obligaciones/prohibiciones/sanciones Art.58.\nSECCION 11 MAPAS RIESGOS: Item 53 Mapas riesgo visibles con esquema y principales riesgos Art.62.\nSECCION 12 VIGILANCIA AMBIENTE Y SALUD: Item 54 Vigilancia ambiental programa OAL Art.67. Item 55 Vigilancia salud trabajadores expuestos Art.67. Item 56 Autorizacion asistencia examenes OAL Art.68.\nSECCION 13 TRASLADO E INVESTIGACION: Item 57 Traslado trabajador con EP sin reduccion renta Art.69. Item 58 Implementa medidas fiscalizadores/OAL/DPR/CPHS Art.70. Item 59 Investigacion accidentes con enfoque genero Art.71.\nSECCION 14 REGISTRO: Item 60 Documentacion gestion riesgo disponible para fiscalizadores Art.72.\n\nRESUMEN EJECUTIVO FINAL:\n- CONTEO: items Cumple X / No Cumple X / No Aplica X\n- NIVEL RIESGO LEGAL: ALTO (>10 NC) / MEDIO (5-10 NC) / BAJO (<5 NC)\n- MULTAS ESTIMADAS en UTM segun DS 44/2024\n- TOP 5 INCUMPLIMIENTOS CRITICOS con plazo recomendado\n- PLAN ACCION INMEDIATA: acciones a tomar antes de proxima fiscalizacion\nElaborado: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';
    return p1+'\n\n===FUF_INTERMEDIO===\n\n'+p2;
  }

  return I+'\n\nElabora PLAN DE EMERGENCIA Y EVACUACION para:\n'+base+'\n\n1.Objetivo, alcance y vigencia. Control: '+ctrl+'\n2.Descripcion instalaciones: superficie, accesos, pisos, capacidad.\n3.Riesgos emergencia ESPECIFICOS del rubro '+e.rubro+' (NO solo incendio/sismo genericos).\n4.Organigrama emergencia proporcional a '+e.trabajadores+' trabajadores: roles reales posibles.\n5.Protocolos detallados: incendio|sismo|emergencia medica|accidente grave|evacuacion.\n6.Vias evacuacion y puntos encuentro: describir o indicar seccion Informacion Pendiente si no hay planos.\n7.Recursos: extintores tipo/clase/ubicacion, botiquin dotacion minima DS 594, senaletica NCh.\n8.Directorio: Bomberos 132, SAMU 131, Carabineros 133, SEREMI Salud region '+e.region+', '+(e.mutualidad||'mutualidad')+'.\n9.Simulacros: frecuencia semestral obligatoria, registro, evaluacion.\n10.Normativa: DS 594/1999 Art.44-54, NCh 934 Of.2008, NCh 1433, DS 44/2024 Art.19.\n11.Firma: Alan Bascur Montenegro IPR Plus Control SpA. Fecha: '+fecha+'.';
}

async function callClaude(prompt){
  var res=await fetch('/api/claude',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({prompt:prompt})
  });
  var txt=await res.text();
  var data;
  try{ data=JSON.parse(txt); }
  catch(e){ throw new Error('Respuesta invalida: '+txt.substring(0,100)); }
  if(data.texto)return data.texto;
  throw new Error(data.error||'Sin respuesta. Status: '+res.status);
}

async function startGen(){
  if(!gEmp||!gTipo)return;
  var e=gEmp;
  var out=document.getElementById('ai-out');
  var lbl=document.getElementById('ai-lbl');
  var btn=document.getElementById('btn-gp3');
  var acts=document.getElementById('gp3-acts');
  gTexto='';btn.disabled=true;acts.style.display='none';
  out.innerHTML='<div class="ai-loading"><div class="dots"><span></span><span></span><span></span></div>Analizando normativa chilena 2025...</div>';
  lbl.textContent='Claude . Generando '+TIPO_N[gTipo]+'...';
  document.getElementById('ai-pulse').classList.add('live');
  var s=0;clearInterval(tmrInt);
  tmrInt=setInterval(function(){s++;document.getElementById('ai-tmr').textContent=pad(Math.floor(s/60))+':'+pad(s%60);},1000);
  var normas=(e.normativa||NORM['default']).join(', ');
  var rStr=(e.riesgos||[]).map(function(r){return '- '+r.nombre+' (P:'+r.prob+',C:'+r.cons+')';}).join('\n')||'No especificados';
  var fecha=new Date().toLocaleDateString('es-CL');
  try {
    var texto='';
    if(gTipo==='riohs'){
      lbl.textContent='Claude · Parte 1/4 — Caps. I-V...';
      var p1=await callClaude(buildPrompt(e,'riohs_p1',normas,rStr,fecha));
      out.innerHTML='<div style="color:var(--v3);padding:10px;font-size:12px">✅ Caps I-V listos. Generando VI-X...</div>';
      lbl.textContent='Claude · Parte 2/4 — Caps. VI-X...';
      var p2=await callClaude(buildPrompt(e,'riohs_p2',normas,rStr,fecha));
      out.innerHTML='<div style="color:var(--v3);padding:10px;font-size:12px">✅ Caps VI-X listos. Generando XI-XV...</div>';
      lbl.textContent='Claude · Parte 3/4 — Caps. XI-XV...';
      var p3=await callClaude(buildPrompt(e,'riohs_p3',normas,rStr,fecha));
      out.innerHTML='<div style="color:var(--v3);padding:10px;font-size:12px">✅ Caps XI-XV listos. Generando XVI-XX...</div>';
      lbl.textContent='Claude · Parte 4/4 — Caps. XVI-XX + Ley Karin...';
      var p4=await callClaude(buildPrompt(e,'riohs_p4',normas,rStr,fecha));
      texto=p1.replace('===P1FIN===','').trim()+'\n\n'+p2.replace('===P2FIN===','').trim()+'\n\n'+p3.replace('===P3FIN===','').trim()+'\n\n'+p4;
    } else if(gTipo==='iper'){
      lbl.textContent='Claude · IPER Parte 1/2 — Metodologia y areas...';
      var ip1=await callClaude(buildPrompt(e,'iper_p1',normas,rStr,fecha));
      out.innerHTML='<div style="color:var(--v3);padding:10px;font-size:12px">✅ IPER Parte 1 lista. Generando plan de accion...</div>';
      lbl.textContent='Claude · IPER Parte 2/2 — Plan de accion...';
      var ip2=await callClaude(buildPrompt(e,'iper_p2',normas,rStr,fecha));
      texto=ip1.replace('===IPER1FIN===','').trim()+'\n\n'+ip2;
    } else if(gTipo==='fuf'){
      lbl.textContent='Claude · FUF Parte 1/2 — Items 1-28...';
      var fuf_prompt=buildPrompt(e,'fuf',normas,rStr,fecha);
      var parts_fuf=fuf_prompt.split('===FUF_INTERMEDIO===');
      var fp1=await callClaude(parts_fuf[0].trim());
      out.innerHTML='<div style="color:var(--v3);padding:10px;font-size:12px">✅ FUF Items 1-28 listos. Generando Items 29-60...</div>';
      lbl.textContent='Claude · FUF Parte 2/2 — Items 29-60 + Resumen Ejecutivo...';
      var fp2=await callClaude(parts_fuf[1].trim());
      texto=fp1.replace('===FUF_P1FIN===','').trim()+'\n\n'+fp2;
    } else {
      texto=await callClaude(buildPrompt(e,gTipo,normas,rStr,fecha));
    }
    clearInterval(tmrInt);
    gTexto=texto;
    out.innerHTML=md2html(gTexto);
    lbl.textContent='✅ '+TIPO_N[gTipo]+' - Listo';
    document.getElementById('ai-pulse').classList.remove('live');
    acts.style.display='block';btn.disabled=false;
  } catch(err){
    clearInterval(tmrInt);
    out.innerHTML='<div style="color:var(--rojo2);padding:10px;font-size:12px">⚠ Error: '+err.message+'</div>';
    lbl.textContent='❌ Error';acts.style.display='block';
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

  // Parsear markdown a HTML elegante
  var cuerpo=(gTexto||'')
    .replace(/^#### (.+)$/gm,'<h4 class="h4">$1</h4>')
    .replace(/^### (.+)$/gm,'<h3 class="h3">$1</h3>')
    .replace(/^## (.+)$/gm,'<h2 class="h2">$1</h2>')
    .replace(/^# (.+)$/gm,'<h1 class="h1">$1</h1>')
    .replace(/^\* (.+)$/gm,'<li>$1</li>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n{2,}/g,'</p><p class="p">')
    .replace(/\n/g,'<br>');

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
    '.ffooter{margin-top:16pt;padding-top:8pt;border-top:.5pt solid #e0e0e0;display:flex;justify-content:space-between;font-family:Arial,sans-serif;font-size:7.5pt;color:#aaa;}';

  var portada=
    '<div class="portada">'+
    '<div class="bt"><div class="btlogo">Plus<span>Control</span></div><div class="btsub">Prevencion Integral de Riesgos</div></div>'+
    '<div class="bv"></div>'+
    '<div class="pb">'+
    '<div class="badge">Documento Oficial de Prevencion de Riesgos &nbsp;.&nbsp; Plus Control SpA</div>'+
    '<div class="ptitle">'+tipo+'</div>'+
    '<div class="psub">Normativa Chilena Vigente 2025</div>'+
    '<div class="pdiv"></div>'+
    '<div class="pemp">'+
    '<div class="penombre">'+gEmp.razon+'</div>'+
    '<div class="pedato">'+
    '<strong>RUT:</strong> '+(gEmp.rut||'-')+'<br>'+
    '<strong>Rubro:</strong> '+gEmp.rubro+(gEmp.subrubro?' / '+gEmp.subrubro:'')+'<br>'+
    '<strong>Direccion:</strong> '+(gEmp.direccion||'')+', '+gEmp.ciudad+', Region de '+gEmp.region+'<br>'+
    '<strong>Representante Legal:</strong> '+(gEmp.rep_nombre||'-')+(gEmp.rep_cargo?' - '+gEmp.rep_cargo:'')+'<br>'+
    '<strong>N Trabajadores:</strong> '+gEmp.trabajadores+' &nbsp;|&nbsp; <strong>Mutualidad:</strong> '+(gEmp.mutualidad||'-')+
    '</div></div></div>'+
    '<div class="pfooter">'+
    '<div class="pfizq">Elaborado por:<br><strong style="color:#1a1a1a">Alan Bascur Montenegro</strong><br>Ingeniero en Prevencion de Riesgos<br>Prevencionista de Riesgos Profesionales<br>Plus Control SpA &nbsp;.&nbsp; Osorno, Los Lagos, Chile</div>'+
    '<div class="pfder">Fecha: '+fechaLarga+'<br>Codigo: '+docId+'<br>Version: 1.0</div>'+
    '</div>'+
    '<div class="bb"></div>'+
    '</div>';

  var pagCuerpo=
    '<div class="pag">'+
    '<div class="pghd"><div class="pglogo">Plus<span>Control</span></div><div class="pgdoc">'+tipo+'<br>'+gEmp.razon+' &nbsp;.&nbsp; '+fecha+'</div></div>'+
    '<div>'+cuerpo+'</div>'+
    '<div class="pgft"><span>Plus Control SpA &nbsp;.&nbsp; Prevencion Integral de Riesgos &nbsp;.&nbsp; Osorno, Chile</span><span>'+docId+' &nbsp;.&nbsp; '+fecha+'</span></div>'+
    '</div>';

  var pagFirma=
    '<div class="fsec">'+
    '<div class="pghd"><div class="pglogo">Plus<span>Control</span></div><div class="pgdoc">'+tipo+' &nbsp;.&nbsp; '+gEmp.razon+'</div></div>'+
    '<div class="ftitle">Autorizacion y Firma del Documento</div>'+
    '<div class="fsub">Documento elaborado conforme a normativa chilena vigente. Queda sujeto a la aprobacion de los firmantes.</div>'+
    '<div class="fgrid">'+
    '<div class="fcol">'+
    '<div class="fesp"><div class="fesplbl">Firma y Timbre</div></div>'+
    '<div class="fnombre">Alan Bascur Montenegro</div>'+
    '<div class="fcargo">Ingeniero en Prevencion de Riesgos<br>Prevencionista de Riesgos Profesionales</div>'+
    '<div class="frut">RUT: ___________________</div>'+
    '<div class="forg">Plus Control SpA &nbsp;.&nbsp; Osorno, Los Lagos</div>'+
    firmadoHtml+
    '</div>'+
    '<div class="fcol">'+
    '<div class="fesp"><div class="fesplbl">Firma y Timbre</div></div>'+
    '<div class="fnombre">'+(gEmp.rep_nombre||'Representante Legal')+'</div>'+
    '<div class="fcargo">'+(gEmp.rep_cargo||'Representante Legal')+'</div>'+
    '<div class="frut">RUT: '+(gEmp.rep_rut||'___________________')+'</div>'+
    '<div class="forg">'+gEmp.razon+'</div>'+
    '</div></div>'+
    '<div class="swrap"><div class="sello"><div class="stop">Plus</div><div class="smain">C<span>+</span></div><div class="sbot">Osorno . Chile</div></div></div>'+
    '<div class="nota">'+
    '<strong>Nota Legal:</strong> Elaborado conforme al <strong>Decreto Supremo N 44/2024 MINTRAB</strong> (vigente desde 01-feb-2025, reemplaza DS 40/1969 y DS 54/1969), <strong>Ley N 16.744</strong>, <strong>DS 594/1999 MINSAL</strong>, <strong>Ley 21.643 Ley Karin</strong> (vigente agosto 2024) y normativa especifica del rubro <strong>'+gEmp.rubro+'</strong>. '+
    'Debe ser entregado gratuitamente a cada trabajador, exhibido en lugares visibles del establecimiento y comunicado a la Direccion del Trabajo conforme al art. 156 del Codigo del Trabajo. '+
    'La entidad empleadora <strong>'+gEmp.razon+'</strong> es responsable de su implementacion y cumplimiento.<br><br>'+
    '<strong>Normativa de referencia:</strong> '+normasList+
    '</div>'+
    '<div class="ffooter"><span>Plus Control SpA &nbsp;.&nbsp; Prevencion Integral de Riesgos &nbsp;.&nbsp; Osorno, Los Lagos, Chile</span><span>Cod: '+docId+' &nbsp;.&nbsp; '+fecha+'</span></div>'+
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
function md2html(t){
  return (t||'')
    .replace(/^# (.+)$/gm,'<strong style="font-size:14px;display:block;margin:8px 0 4px">$1</strong>')
    .replace(/^## (.+)$/gm,'<strong style="font-size:12px;color:var(--v3);display:block;margin:8px 0 4px">$1</strong>')
    .replace(/^### (.+)$/gm,'<strong style="font-size:11px;display:block;margin:6px 0 2px">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n/g,'<br>');
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
