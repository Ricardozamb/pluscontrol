const express = require('express');
const path = require('path');
const https = require('https');

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
  'La norma NCh 934 corresponde a clasificación de fuegos; la NCh 2056:2019 corresponde a inspección, mantenimiento y recarga de extintores.',
  'Los planos y zonas de encuentro no revisados deben quedar expresamente PENDIENTES; una fotografía no acredita seguridad de los sectores.',
  'Distingue información declarada, verificada y pendiente. No asegures cumplimiento legal sin revisión profesional.',
  'Entrega contenido técnico en español de Chile acorde con los datos suministrados, sin afirmar que está firmado o aprobado.'
].join('\\n');

const SYSTEM = `Eres el FISCAL TÉCNICO SENIOR DE PREVENCIÓN DE RIESGOS de Plus Control SpA, con 20 años de experiencia en fiscalización de la Dirección del Trabajo, Seremi de Salud y Mutual de Seguridad en Chile. Plus Control SpA es una empresa de asesoría en prevención de riesgos que genera documentos legales para sus clientes.

IDENTIDAD DE PLUS CONTROL (prestador del servicio, no el cliente):
- Razón Social: Plus Control SpA | RUT: 77.916.708-9
- Profesional responsable: Alan Bascur Montenegro, Ingeniero en Prevención de Riesgos, RUT 17.658.387-8
- Domicilio: Lastarrias 602, Osorno, Región de Los Lagos

MISIÓN: Generar documentos 100% conformes a legislación chilena vigente, coherentes internamente, ajustados a los datos REALES de cada empresa cliente.

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

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones HttpOnly, SameSite y autenticación real del endpoint que consume créditos.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
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
  const account = CUENTAS[name];
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

// ── Endpoint SSE — envía chunks al cliente en tiempo real ──
// Esto resuelve el problema de Render Free que corta conexiones largas sin actividad:
// al enviar datos continuamente, la conexión se mantiene viva.
app.post('/api/claude', requireAuth, (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen inválido.' });
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado para generar documentos.' });
  const ip = req.ip || 'unknown';
  if (tooMany(cuotas, ip, HOUR_LIMIT, 60 * 60 * 1000)) return res.status(429).json({ error: 'Límite horario alcanzado.' });
  const key = req.usuario.username;
  if (activos.has(key)) return res.status(429).json({ error: 'Ya hay una generación en curso. Espere a que termine.' });

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

  activos.add(key);
  res.on('close', () => activos.delete(key));
  res.on('finish', () => activos.delete(key));
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

  const req2 = https.request(options, r => {
    let buffer = '';

    // Si la API no responde 200, el cuerpo NO es SSE: es JSON plano.
    // Sin este control el flujo se cerraba vacío y el cliente recibía
    // "Sin contenido" en vez del error real (429 rate limit, 529 overloaded).
    if (r.statusCode !== 200) {
      let errBody = '';
      r.on('data', c => { errBody += c.toString(); });
      r.on('end', () => {
        let msg = 'Error API (HTTP ' + r.statusCode + ')';
        try {
          const j = JSON.parse(errBody);
          if (j.error && j.error.message) msg = j.error.message;
        } catch (e) {}
        if (r.statusCode === 429) msg = 'RATE_LIMIT: demasiadas solicitudes seguidas. Espere unos segundos.';
        if (r.statusCode === 529) msg = 'OVERLOADED: servicio saturado. Reintente en unos segundos.';
        clearInterval(keepAlive);
        res.write('data: ' + JSON.stringify({ error: msg, status: r.statusCode }) + '\n\n');
        res.end();
      });
      return;
    }

    r.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const obj = JSON.parse(data);
          if (obj.type === 'content_block_delta' && obj.delta && obj.delta.text) {
            // Enviar chunk al cliente inmediatamente — mantiene la conexión viva
            res.write('data: ' + JSON.stringify({ chunk: obj.delta.text }) + '\n\n');
          }
          if (obj.type === 'error') {
            res.write('data: ' + JSON.stringify({ error: (obj.error && obj.error.message) || 'Error API' }) + '\n\n');
            res.end();
          }
        } catch(e) {}
      }
    });

    r.on('end', () => {
      // Procesar buffer residual
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          try {
            const obj = JSON.parse(data);
            if (obj.type === 'content_block_delta' && obj.delta && obj.delta.text) {
              res.write('data: ' + JSON.stringify({ chunk: obj.delta.text }) + '\n\n');
            }
          } catch(e) {}
        }
      }
      // Señal de fin
      clearInterval(keepAlive);
      res.write('data: ' + JSON.stringify({ done: true }) + '\n\n');
      res.end();
    });

    r.on('error', err => {
      clearInterval(keepAlive);
      res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
      res.end();
    });
  });

  req2.setTimeout(300000, () => {
    clearInterval(keepAlive);
    req2.destroy();
    res.write('data: ' + JSON.stringify({ error: 'La generación tardó más de 5 minutos. Intente nuevamente.' }) + '\n\n');
    res.end();
  });

  req2.on('error', err => {
    clearInterval(keepAlive);
    res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
    res.end();
  });

  req2.write(payload);
  req2.end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log('Plus Control activo en puerto ' + PORT));
