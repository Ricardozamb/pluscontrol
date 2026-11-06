const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const https = require('node:https');
const { EventEmitter } = require('node:events');
const { Readable } = require('node:stream');

const browser = {
  window: {},
  document: { readyState: 'loading', addEventListener() {} },
  localStorage: { getItem() { return null; } }
};
vm.runInNewContext(fs.readFileSync('public/condominios.js', 'utf8'), browser);
const { auditar, validarDocumento, rolesSuscripcion } = browser.window.PCCondominios;

// Extracto anonimizado y estructurado del PDF de Los Coihues, páginas 3, 5, 8, 13, 22 y 26.
test('Los Coihues: pisos inexistentes, primera versión contradictoria y evidencia pendiente', () => {
  const input = {
    torres: '4', pisos: 'A:5; B:5; C:4; D:4', equipos_piso: 'C|Detector|5|4\nD|Detector|5|4',
    situacion: 'primer_plan', fecha_ant: '2026-10-05', fecha_elab: '2026-10-05',
    zonas_info: 'A: frente a conserjería'
  };
  const findings = auditar(input).join('\n');
  for (const pattern of [/INCONSISTENCIA:.*torre C/, /INCONSISTENCIA:.*torre D/,
    /primer plan registra/, /fecha anterior debe preceder/, /asistencia/, /plano no acreditado/,
    /zonas de encuentro requieren inspección/, /faltan rutas/]) assert.match(findings, pattern);
  const text = process.env.PC_COIHUES_TEXT ? fs.readFileSync(process.env.PC_COIHUES_TEXT, 'utf8')
    : 'Punto de encuentro provisorio frente a conserjería.\n[PLANO A CARGAR POR PLUS CONTROL]';
  const output = validarDocumento(text).join('\n');
  assert.match(output, /punto de encuentro provisorio/);
  assert.match(output, /plano de evacuación todavía no está incorporado/);
});

test('controla rutas y equipos sin descartar cantidades de asistencia explícitamente en cero', () => {
  const findings = auditar({
    pisos: 'A:2', equipos_piso: 'A|Detector|1|2\nA|detector|1|2',
    zonas_info: 'A: patio', rutas: 'A|1|Escalera|patio\nA|2|Escalera|calle',
    mov_reducida: '0', discapacidad: '0', infantes: '0', mayores: '0'
  }).join('\n');
  assert.match(findings, /equipo duplicado/);
  assert.match(findings, /ruta sin piso, recorrido o zona concordante/);
  assert.doesNotMatch(findings, /levantamiento agregado/);
});

test('los espacios de suscripción dependen del régimen declarado', () => {
  const roles = situacion => Array.from(rolesSuscripcion({ situacion }), row => row.cargo);
  assert.match(roles('primer_plan').join(), /propietaria/);
  assert.doesNotMatch(roles('primer_plan').join(), /Administrador|Presidente/);
  assert.match(roles('regularizacion').join(), /Presidente/);
  assert.doesNotMatch(roles('regularizacion').join(), /Administrador|propietaria/);
  assert.match(roles('actualizacion').join(), /Presidente.*Administrador/);
  assert.match(roles('pendiente').join(), /pendientes de determinar/);
});

test('servidor protege Claude y conserva SSE, UTF-8 y la confirmación de término', async t => {
  process.env.ANTHROPIC_API_KEY = 'simulated';
  process.env.PC_ADMIN_PASSWORD = 'simulated-admin';
  process.env.PC_ALAN_PASSWORD = 'simulated-other';
  const app = require('../server');
  const server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = 'http://127.0.0.1:' + server.address().port;
  const post = (path, body, headers) => fetch(url + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body)
  });
  assert.equal((await post('/api/claude', {})).status, 401);
  assert.equal((await post('/api/auth/login', {}, { Origin: 'https://other.example' })).status, 403);
  const login = await post('/api/auth/login', { username: 'ricardo', password: 'simulated-admin' });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly; SameSite=Strict/);
  const headers = { Cookie: cookie.split(';')[0] };
  let stopReason = 'end_turn';
  let sendStop = true;
  t.mock.method(https, 'request', (options, callback) => {
    assert.equal(options.hostname, 'api.anthropic.com');
    const request = new EventEmitter();
    request.write = payload => assert.equal(JSON.parse(payload).stream, true);
    request.setTimeout = () => {};
    request.destroy = () => {};
    request.end = () => {
      const text = Buffer.from('data: {"type":"content_block_delta","delta":{"text":"Evacuación"}}\n\n');
      const split = text.indexOf(Buffer.from('ó')) + 1;
      const chunks = [text.subarray(0, split), text.subarray(split)];
      if (sendStop) {
        chunks.push('data: ' + JSON.stringify({ type: 'message_delta', delta: { stop_reason: stopReason } }) + '\n\n');
        chunks.push('data: {"type":"message_stop"}\n\n');
      }
      const upstream = Readable.from(chunks);
      upstream.statusCode = 200;
      callback(upstream);
    };
    return request;
  });
  const generate = async () => {
    const response = await post('/api/claude', { prompt: 'Prueba', docType: 'condominio' }, headers);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    return response.text();
  };
  const complete = await generate();
  assert.match(complete, /Evacuación/);
  assert.match(complete, /"done":true/);
  stopReason = 'max_tokens';
  const truncated = await generate();
  assert.match(truncated, /límite de texto/);
  assert.doesNotMatch(truncated, /"done":true/);
  sendStop = false;
  const disconnected = await generate();
  assert.match(disconnected, /no completó/);
  assert.doesNotMatch(disconnected, /"done":true/);
});

test('capítulo 4: exige encabezado y contenido y admite numeración romana', () => {
  const advertencia = /falta el capítulo 4 o su contenido/;
  for (const incomplete of [
    '## CAPÍTULO 3 — DEFINICIONES\nVéase el capítulo 4 para más detalles.',
    '## CAPÍTULO 4 — DESCRIPCIÓN DEL CONDOMINIO\n[PENDIENTE]\n## PASO I\nOrganización.',
    '## CAPÍTULO 4 — DESCRIPCIÓN DEL CONDOMINIO\n### 4.1 Edificios'
  ]) assert.match(validarDocumento(incomplete).join('\n'), advertencia);
  for (const heading of ['## CAPÍTULO 4 — DESCRIPCIÓN DEL CONDOMINIO', '## **Capítulo IV: Descripción del condominio**']) {
    assert.doesNotMatch(validarDocumento(heading + '\n### 4.1 Edificios\nConfiguración física declarada.').join('\n'), advertencia);
  }
});
