const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const APIKEY = process.env.ANTHROPIC_API_KEY || '';

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
- Medidas cautelares: DENTRO DE 5 DÍAS HÁBILES desde la denuncia (separación física obligatoria)
- Investigación: designar investigador en 3 días hábiles, informe DENTRO DE 30 DÍAS HÁBILES
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

// CORS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// ── Endpoint SSE — envía chunks al cliente en tiempo real ──
// Esto resuelve el problema de Render Free que corta conexiones largas sin actividad:
// al enviar datos continuamente, la conexión se mantiene viva.
app.post('/api/claude', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (!APIKEY) {
    res.status(500).json({ error: 'API key no configurada en variables de entorno' });
    return;
  }
  const { prompt } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: 'Prompt vacío' });
    return;
  }

  // Responder como SSE para mantener la conexión viva en Render Free
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no'); // deshabilitar buffering en Nginx/Render

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-5',
    max_tokens: 8000,
    stream: true,
    system: SYSTEM,
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
      res.write('data: ' + JSON.stringify({ done: true }) + '\n\n');
      res.end();
    });

    r.on('error', err => {
      res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
      res.end();
    });
  });

  req2.setTimeout(300000, () => {
    req2.destroy();
    res.write('data: ' + JSON.stringify({ error: 'La generación tardó más de 5 minutos. Intente nuevamente.' }) + '\n\n');
    res.end();
  });

  req2.on('error', err => {
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
