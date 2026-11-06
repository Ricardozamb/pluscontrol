const express = require('express');
const path = require('path');
const https = require('https');
const HTMLtoDOCX = require('@turbodocx/html-to-docx');
const sanitizeHtml = require('sanitize-html');

const app = express();
const PORT = process.env.PORT || 3000;
const APIKEY = process.env.ANTHROPIC_API_KEY || '';
const crypto = require('crypto');

// Las contraseñas no deben estar en public/app.js ni guardarse en el repositorio.
const CUENTAS = {
  ricardo: { password: process.env.PC_ADMIN_PASSWORD || '', nombre: 'Ricardo Zambrano Luna', cargo: 'Administrador', rol: 'admin' },
  alan: { password: process.env.PC_ALAN_PASSWORD || '', nombre: 'Alan Bascur Montenegro', cargo: 'Ingeniero en Prevención de Riesgos', rol: 'iper' }
};
const sesiones = new Map();
const intentos = new Map();
const cuotas = new Map();
const activos = new Set();
const SESSION_MS = 8 * 60 * 60 * 1000;
const HOUR_LIMIT = Number(process.env.PC_AI_REQUESTS_PER_HOUR || 30);
app.set('trust proxy', 1);

function sameOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return true;
  try {
    const o = new URL(origin);
    const host = req.get('host');
    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
    return o.host === host && o.protocol === proto + ':';
  } catch (e) { return false; }
}
function cookies(req) {
  const result = {};
  for (const pair of (req.get('cookie') || '').split(';')) {
    const p = pair.trim().split('=');
    if (p.length > 1) result[p.shift()] = p.join('=');
  }
  return result;
}
function userFromRequest(req) {
  const token = cookies(req).pc_sid, row = token && sesiones.get(token);
  if (!row) return null;
  if (row.exp < Date.now()) { sesiones.delete(token); return null; }
  return row.user;
}
function requireAuth(req, res, next) {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Debe iniciar sesión.' });
  req.usuario = user;
  next();
}
function tooMany(table, key, max, duration) {
  const now = Date.now();
  const item = table.get(key);
  if (!item || item.end < now) { table.set(key, { count: 1, end: now + duration }); return false; }
  item.count++;
  return item.count > max;
}
function passwordMatches(a, b) {
  if (!a || !b) return false;
  const x = crypto.createHash('sha256').update(a).digest();
  const y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y);
}
const SYSTEM_CONDO = [
  'Eres asistente técnico de Plus Control SpA para elaborar BORRADORES de planes de emergencia y evacuación de condominios en Chile.',
  'Fundamento: Ley 21.442 artículo 40 y Reglamento de Copropiedad Inmobiliaria. Distingue las reglas del primer plan y las actualizaciones.',
  'No inventes nombres, cantidades, ubicaciones, fechas, planos, mantenciones, contactos, firmas, aprobaciones ni normas no verificadas.',
  'Fundamenta las reglas de suscripción en el artículo 40 de la Ley 21.442 y el artículo 33 del DS 7 MINVU para el supuesto preexistente sin plan. No inventes referencias técnicas ni atribuyas firma o autoría.',
  'Los planos y zonas de encuentro no revisados deben quedar expresamente PENDIENTES; una fotografía no acredita seguridad de los sectores.',
  'En extintores PQS distingue masa nominal en kg, concentración del agente según etiqueta y condición de carga. Un porcentaje del PQS es concentración del agente; jamás lo presentes como porcentaje de carga. Si falta etiqueta o inspección, registra el dato como pendiente.',
  'Reglamento DS 7 MINVU, art. 34: actualizar el plan de evacuación al menos anualmente y contemplar capacitación y simulacros según escenarios. Si se acredita que las condiciones no cambiaron, la vía del informe fundado requiere nueva suscripción y anexar el informe.',
  'Reglamento DS 7 MINVU, art. 35: entrega material y digital a Carabineros y Bomberos. En el primer plan del art. 40 la realiza la persona propietaria antes del trámite municipal pertinente. En actualizaciones la realiza el comité dentro de 15 días corridos desde la suscripción por presidente y administrador. Registra constancias y deja pendiente el responsable cuando el supuesto requiere cotejo.',
  'Distingue información declarada, verificada y pendiente. No asegures cumplimiento legal sin revisión profesional.',
  'Entrega contenido técnico en español de Chile acorde con los datos suministrados, sin afirmar que está firmado o aprobado.'
].join('\n');

const SYSTEM = `Eres el FISCAL TÉCNICO SENIOR DE PREVENCIÓN DE RIESGOS de Plus Control SpA, con 20 años de experiencia en fiscalización de la Dirección del Trabajo, Seremi de Salud y Mutual de Seguridad en Chile. Plus Control SpA es una empresa de asesoría en prevención de riesgos que genera documentos legales para sus clientes.

IDENTIDAD DE PLUS CONTROL (prestador del servicio, no el cliente):
- Razón Social: Plus Control SpA | RUT: 77.916.708-9
- Profesional responsable: Alan Bascur Montenegro, Ingeniero en Prevención de Riesgos, RUT 17.658.387-8
- Domicilio: Lastarrias 602, Osorno, Región de Los Lagos

MISIÓN: Generar borradores técnicos para revisión profesional, coherentes con los datos declarados. Marca datos faltantes o contradictorios y evita atribuir firmas, inspecciones o cumplimiento sin evidencia.

═══════════════════════════════════════════════════════
REGLA N°1 — COHERENCIA DE DATOS
═══════════════════════════════════════════════════════
USA EXACTAMENTE los datos del cliente en CADA sección. NUNCA uses placeholders ni inventes valores.

═══════════════════════════════════════════════════════
REGLA N°2 — RIESGOS Y EPP REALES DEL RUBRO
═══════════════════════════════════════════════════════
La MIPER, PTS y RIOHS DEBEN describir riesgos y EPP REALES del rubro específico del cliente.

═══════════════════════════════════════════════════════
REGLA N°3 — NORMATIVA VIGENTE CHILE 2026
═══════════════════════════════════════════════════════
- DS 44/2024 MINTRAB (vigente 01-feb-2025, reemplaza DS 40/1969 y DS 54/1969)
- Ley 16.744 — Accidentes del Trabajo y Enfermedades Profesionales
- Código del Trabajo Arts. 153-157 (RIOHS), Art. 184 (deber protección), Art. 154 N°7 (multas), Art. 157 (destino multas)
- DS 594/1999 MINSAL — Condiciones Sanitarias y Ambientales
- Ley 21.561/2023 — LÍMITE VIGENTE desde 26-abr-2026: 42 hrs/semana TODAS las empresas
- Ley 20.949/2016 — cargas manuales: máx. 25 kg hombres, 15 kg mujeres (condiciones ideales)
- Ley 21.643 Ley Karin (vigente agosto 2024) + DS 2/2024 MINTRAB
- DS 2/2024 MINTRAB — Reglamento Ley Karin
- Protocolo TMERT Res.327/2024 — Trastornos musculoesqueléticos
- Protocolo PREXOR — Exposición a ruido ocupacional
- Protocolo ERA — Exposición a agentes químicos y biológicos
- Protocolo CEAL-SM-SUSESO — Riesgos psicosociales
- NCh 934 Of.2008 — Extintores portátiles
- NCh 1914 Of.2005 — Cilindros para gases comprimidos
- NCh 382 Of.2004 — Sustancias peligrosas
- DS 298/1995 MINTRANSP — Transporte sustancias peligrosas

═══════════════════════════════════════════════════════
REGLA N°4 — PROPORCIONALIDAD SEGÚN DOTACIÓN
═══════════════════════════════════════════════════════
- Menos de 10 trabajadores: sin Delegado SST ni CPHS. Empleador asume funciones. Participación directa asambleas mensuales.
- 10 a 24 trabajadores: Delegado SST OBLIGATORIO (DS 44/2024 Art.66) — elegido por trabajadores mediante votación, acta, registro DT.
- 25 o más trabajadores: CPHS OBLIGATORIO (DS 44/2024 Art.23) — 3 rep. empleador + 3 rep. trabajadores.
- Más de 100 trabajadores: Departamento de Prevención de Riesgos con experto (DS 44/2024 Art.50).

═══════════════════════════════════════════════════════
REGLA N°5 — LEY KARIN (Ley 21.643 + DS 2/2024)
═══════════════════════════════════════════════════════
Todo RIOHS DEBE incluir el protocolo completo:
- Definición acoso laboral: agresión u hostigamiento, UNA SOLA VEZ O reiterada (no requiere reiteración)
- Canal denuncia interno: responsable nominado, acuse recibo 2 días hábiles
- Medidas de resguardo: adoptarse en un plazo NO MAYOR A 3 DÍAS de recibida la denuncia (separación de espacios, redistribución de jornada, atención psicológica temprana). El empleador debe INFORMAR a la DT el inicio de la investigación y las medidas dentro de 3 DÍAS HÁBILES desde la recepción de la denuncia (Reglamento Ley Karin, circulares DT 2024)
- Investigación interna: plazo de 30 DÍAS HÁBILES desde la recepción de la denuncia (DT dictamen Ord.386/10 de 2025; inhábiles = sábados, domingos y festivos). Concluida, el informe se remite a la DT dentro de 2 DÍAS; la DT tiene 30 DÍAS para pronunciarse; el empleador aplica medidas y sanciones en 15 DÍAS CORRIDOS
- Canal externo DT: plazo 90 DÍAS CORRIDOS desde el hecho
- Protección denunciante: confidencialidad, prohibición represalias

═══════════════════════════════════════════════════════
REGLA N°6 — PROTOCOLO ALCOHOL Y DROGAS (DS 44/2024 Art.9)
═══════════════════════════════════════════════════════
- Prohibición absoluta con base legal explícita
- Indicios razonables que habilitan el test: aliento alcohólico, conducta alterada, coordinación deteriorada, ojos enrojecidos
- Test aplicado por profesional de salud o institución acreditada
- Derecho del trabajador a solicitar segunda muestra
- Resultado positivo: suspensión inmediata, proceso disciplinario
- Negativa al test: se considera positivo (criterio DT)

═══════════════════════════════════════════════════════
REGLA N°7 — CERO TRUNCAMIENTO
═══════════════════════════════════════════════════════
NUNCA dejes un artículo a medias. Cada artículo mínimo 3 oraciones completas. Usa marcadores de fin cuando corresponda.

FORMATO: ## capítulos, Art.N artículos, tablas markdown. Español chileno formal técnico-legal.`;

const readJson = express.json({ limit: '2mb' });
app.use((req, res, next) => req.path === '/api/condominios/word' ? next() : readJson(req, res, next));


// Sesiones HttpOnly, SameSite y autenticación real del endpoint que consume créditos.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/auth/me', (req, res) => {
  const u = userFromRequest(req);
  if (!u) return res.status(401).json({ error: 'Sin sesión.' });
  res.json({ user: u });
});
app.post('/api/auth/login', (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen inválido.' });
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (tooMany(intentos, ip, 12, 15 * 60 * 1000)) return res.status(429).json({ error: 'Demasiados intentos. Intente más tarde.' });
  const name = String((req.body || {}).username || '').trim().toLowerCase();
  const pass = String((req.body || {}).password || '');
  if (!process.env.PC_ADMIN_PASSWORD || !process.env.PC_ALAN_PASSWORD) {
    return res.status(503).json({ error: 'Configure PC_ADMIN_PASSWORD y PC_ALAN_PASSWORD en Render.' });
  }
  const account = Object.hasOwn(CUENTAS, name) ? CUENTAS[name] : null;
  if (!account || !passwordMatches(account.password, pass)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  const user = { username: name, nombre: account.nombre, cargo: account.cargo, rol: account.rol };
  const token = crypto.randomBytes(32).toString('hex');
  sesiones.set(token, { user, exp: Date.now() + SESSION_MS });
  res.cookie('pc_sid', token, { httpOnly: true, sameSite: 'strict', secure: req.secure || req.get('x-forwarded-proto') === 'https', path: '/', maxAge: SESSION_MS });
  res.json({ user });
});
app.post('/api/auth/logout', (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen inválido.' });
  const token = cookies(req).pc_sid;
  if (token) sesiones.delete(token);
  res.clearCookie('pc_sid', { httpOnly: true, sameSite: 'strict', path: '/' });
  res.json({ ok: true });
});

function wordImageAllowed(src) {
  if (typeof src !== 'string' || src.length > 550000) return false;
  const match = src.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const bytes = Buffer.from(match[2].slice(0, 16), 'base64');
  return match[1] === 'png'
    ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    : bytes.subarray(0, 3).toString('hex') === 'ffd8ff';
}

app.post('/api/condominios/word', requireAuth, express.json({ limit: '4mb' }), async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen inválido.' });
  const html = req.body?.html;
  if (typeof html !== 'string' || !html.trim()) {
    return res.status(400).json({ error: 'Falta el contenido del borrador.' });
  }
  const cleaned = sanitizeHtml(html, {
    allowedTags: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'br', 'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'img'],
    allowedAttributes: { img: ['src', 'alt'], div: ['class'] },
    allowedClasses: { div: ['page-break'] },
    allowedSchemes: [],
    allowedSchemesByTag: { img: ['data'] },
    allowProtocolRelative: false,
    exclusiveFilter: ({ tag, attribs }) => tag === 'img' && !wordImageAllowed(attribs.src)
  });
  try {
    const docx = await HTMLtoDOCX(cleaned, null, {
      title: 'Plan de emergencia y evacuación',
      font: 'Calibri',
      fontSize: 22,
      pageSize: { width: 11906, height: 16838 },
      table: { row: { cantSplit: true } }
    });
    res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document').send(docx);
  } catch {
    res.status(422).json({ error: 'No se pudo convertir el borrador a Word. Revisa los archivos adjuntos.' });
  }
});

// ── Endpoint SSE — envía chunks al cliente en tiempo real ──
// Esto resuelve el problema de Render Free que corta conexiones largas sin actividad:
// al enviar datos continuamente, la conexión se mantiene viva.
app.post('/api/claude', (req, res, next) => {
  res.setHeader('X-Request-ID', crypto.randomUUID());
  res.on('finish', () => {
    if (res.statusCode >= 400) console.warn('generation rejected', res.getHeader('X-Request-ID'), res.statusCode, res.locals.errorCode || '');
  });
  next();
}, requireAuth, (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen inválido.' });
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado para generar documentos.' });
  const key = req.usuario.username;
  if (activos.has(key)) {
    res.locals.errorCode = 'GENERATION_IN_PROGRESS';
    return res.status(429).json({ code: res.locals.errorCode, error: 'Ya hay una generación en curso para tu cuenta. Espera a que termine.' });
  }

  if (!APIKEY) {
    res.status(500).json({ error: 'API key no configurada en variables de entorno' });
    return;
  }
  const { prompt, docType, maxTokens } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 150000) {
    res.status(400).json({ error: 'Prompt vacío' });
    return;
  }
  // SYSTEM alternativo: permite que módulos con marco legal distinto
  // (ej. condominios — Ley 21.442) no hereden el SYSTEM de empresas,
  // que declara normativa laboral (DS 44/2024, Ley Karin) no aplicable.
  const SYSTEM_USADO = docType === 'condominio' ? SYSTEM_CONDO : SYSTEM;
  const MAX_TOKENS = (Number.isInteger(maxTokens) && maxTokens > 0 && maxTokens <= 8192) ? maxTokens : 8192;

  if (tooMany(cuotas, key, HOUR_LIMIT, 60 * 60 * 1000)) {
    const seconds = Math.max(1, Math.ceil((cuotas.get(key).end - Date.now()) / 1000));
    res.setHeader('Retry-After', String(seconds));
    res.locals.errorCode = 'PLUSCONTROL_RATE_LIMIT';
    return res.status(429).json({ code: res.locals.errorCode, error: 'Límite horario de Plus Control alcanzado. Reintenta en ' + Math.ceil(seconds / 60) + ' min.' });
  }

  activos.add(key);
  res.on('close', () => activos.delete(key));
  // Responder como SSE para mantener la conexión viva en Render Free
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no'); // deshabilitar buffering en Nginx/Render

  // Heartbeat cada 20s — evita que Render Free e iOS Safari corten la conexión SSE
  // por inactividad durante las partes largas del RIOHS (8 llamadas secuenciales).
  // Los comentarios SSE (": ping") son ignorados por el cliente.
  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch(e) {}
  }, 20000);

  // Limpiar heartbeat en cualquier cierre de conexión
  res.on('close', () => clearInterval(keepAlive));
  res.on('finish', () => clearInterval(keepAlive));

  const payload = JSON.stringify({
    model: 'claude-sonnet-5',
    max_tokens: MAX_TOKENS,
    stream: true,
    system: SYSTEM_USADO,
    messages: [{ role: 'user', content: prompt }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': APIKEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  function send(event) {
    if (!res.destroyed && !res.writableEnded) res.write('data: ' + JSON.stringify(event) + '\n\n');
  }
  function fail(message, status) {
    if (res.destroyed || res.writableEnded) return;
    const requestId = res.getHeader('X-Request-ID');
    console.warn('generation upstream failure', requestId, status || '', message);
    send({ error: message, status, requestId });
    res.end();
  }

  const req2 = https.request(options, upstream => {
    upstream.setEncoding('utf8');
    upstream.on('error', () => fail('Se interrumpió la conexión con Claude.'));
    if (upstream.statusCode !== 200) {
      const status = upstream.statusCode;
      upstream.resume();
      const motivos = {
        400: 'Claude rechazó la solicitud (400). Revisa la configuración del modelo.',
        401: 'Claude rechazó la clave de API (401). Revisa ANTHROPIC_API_KEY en Render.',
        403: 'La clave de API no tiene permiso en Claude (403).',
        404: 'Claude no encontró el modelo configurado (404).',
        429: 'Claude alcanzó su límite de solicitudes (429).'
      };
      fail(motivos[status] || 'Claude devolvió HTTP ' + status + '.', status);
      return;
    }

    let buffer = '';
    let stopReason;
    let stopped = false;
    function readLine(line) {
      if (!line.startsWith('data: ')) return;
      const event = JSON.parse(line.slice(6));
      if (event.type === 'content_block_delta' && event.delta?.text) send({ chunk: event.delta.text });
      if (event.type === 'message_delta') stopReason = event.delta?.stop_reason || stopReason;
      if (event.type === 'message_stop') stopped = true;
      if (event.type === 'error') fail('Claude interrumpió la generación: ' + (event.error?.type || 'error'));
    }
    function readLines(chunk) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      try {
        for (const line of lines) readLine(line);
      } catch {
        fail('Claude devolvió un evento ilegible.');
      }
    }
    upstream.on('data', readLines);
    upstream.on('end', () => {
      readLines('\n');
      if (res.writableEnded || res.destroyed) return;
      if (!stopped || !['end_turn', 'stop_sequence'].includes(stopReason)) {
        fail(stopReason === 'max_tokens' ? 'Claude alcanzó el límite de texto de esta parte.' : 'Claude no completó esta parte.');
        return;
      }
      send({ done: true });
      res.end();
    });
  });

  res.on('close', () => req2.destroy());
  req2.setTimeout(280000, () => {
    fail('La generación superó el tiempo de espera.');
    req2.destroy();
  });
  req2.on('error', () => {
    if (!res.destroyed && !res.writableEnded) fail('No se pudo conectar con Claude.');
  });

  req2.write(payload);
  req2.end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) app.listen(PORT, () => console.log('Plus Control activo en puerto ' + PORT));
module.exports = app;
