# Plus Control — Despliegue en Render.com

## Por qué Render en vez de Netlify
Netlify plan gratuito tiene límite de 10 segundos por función.
Render no tiene ese límite — perfecto para generar documentos con IA.

---

## Despliegue en 5 pasos

### Paso 1 — Subir a GitHub
1. Ve a github.com y crea una cuenta (gratis)
2. Crea un repositorio nuevo llamado `pluscontrol`
3. Sube esta carpeta completa

### Paso 2 — Crear cuenta en Render
Ve a render.com y regístrate con tu cuenta de GitHub

### Paso 3 — Crear Web Service
1. En Render dashboard → "New +" → "Web Service"
2. Conecta tu repositorio `pluscontrol`
3. Configura:
   - **Name:** pluscontrol
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Paso 4 — Agregar API Key
En Render → tu servicio → "Environment" → "Add Environment Variable":
- Key: `ANTHROPIC_API_KEY`
- Value: tu clave `sk-ant-...`

### Paso 5 — Deploy
Clic en "Deploy". En 2-3 minutos tendrás una URL tipo:
`https://pluscontrol.onrender.com`

Abre esa URL en Safari del iPhone → Compartir → Agregar a pantalla de inicio

---

## Alternativa sin GitHub (más simple)
Render también acepta deploy directo desde un ZIP.
En render.com → "New +" → "Web Service" → "Deploy from disk"
