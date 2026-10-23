const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../public/condominios.js'), 'utf8');
const scope = {window:{}, localStorage:{getItem:()=>null,setItem(){}},
 document:{readyState:'loading',addEventListener(){}}, console, Date, JSON, Set, Promise};
vm.runInNewContext(source,scope);
const start=source.indexOf('function auditoriaCondo(c) {');
const stop=source.indexOf('\n  function validarDocumento(texto)',start);
assert.ok(start>=0 && stop>start, 'Debe existir auditoriaCondo');
const fn=source.slice(start,stop);
const audit=vm.runInNewContext('(' + fn + '\n auditoriaCondo)', {Number, String, Object, Array});
const base={situacion:'actualizacion',torres:'4',pisos:'A:5; B:5; C:4; D:4',
 equipos_piso:'C|detector|4|2\nD|extintor|4|1',
 plano_estado:'revisado',plano_revisor:'Revisor',plano_fecha:'2026-10-23',
 plano_info:'Plano v2',plano_evidencia:'Acta física 12',zonas_estado:'inspeccionadas',
 zonas_revisor:'Revisor',zonas_fecha:'2026-10-23',zonas_evidencia:'Inspección en terreno',
 zonas_info:'A: patio 1; B: patio 2; C: patio 3; D: patio 4'};
const ok=audit(base);
assert.ok(!ok.some(x=>x.includes('definición de pisos')||x.includes('piso 4')||x.includes('número declarado')||x.includes('zona de encuentro registrada')),ok.join('\n'));
assert.ok(audit({...base,equipos_piso:'C|detector|5|1'}).some(x=>x.includes('piso 5 inexistente')));
assert.ok(audit({...base,equipos_piso:'Z|detector|1|1'}).some(x=>x.includes('torre no declarada')));
assert.ok(audit({...base,equipos_piso:'C|detector|4|0'}).some(x=>x.includes('registro de equipo inválido')));
assert.ok(audit({...base,zonas_info:'A: patio; B: patio; C: patio'}).some(x=>x.includes('torre D')));
assert.ok(audit({...base,plano_estado:'pendiente'}).some(x=>x.includes('plano no acreditado')));
assert.ok(audit({...base,situacion:'regularizacion'}).some(x=>x.includes('artículo 33')));
console.log('PASS: auditoría de condominios — pisos, torres, cantidad, zonas, plano y firmantes');
