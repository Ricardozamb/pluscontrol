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

### Pruebas de calidad documental

Ejecutar `npm ci --ignore-scripts` y `npm test`. La integración SSE abre un servidor local de prueba y simula las respuestas de Claude sin credenciales ni consumo de API. La regresión de Los Coihues conserva únicamente los datos necesarios para reproducir los hallazgos. Para cotejar también el texto completo del PDF original en local, establecer `PC_COIHUES_TEXT` con la ruta al archivo de texto extraído. El PDF original se conserva fuera de Git.

Los borradores de condominios se guardan en el navegador. Cada nueva versión conserva la anterior y una copia del levantamiento utilizado. La exportación JSON incluye ese historial. La restauración agrega registros que no existen en el dispositivo y conserva los que ya tienen el mismo identificador. Un archivo de respaldo puede contener datos internos del condominio. Conservarlo con acceso restringido.

Los controles de entrada y salida orientan la revisión. Los archivos de plano se cotejan por separado y el PDF de la app se emite como borrador sin firma. La inspección en terreno, la aplicabilidad normativa y la suscripción corresponden a las personas responsables.

La ficha de condominio admite una foto de acceso y hasta cuatro láminas JPG/PNG de 400 KB por archivo. Para incorporar un plano disponible en PDF, exportar sus páginas relevantes como imágenes legibles. Los archivos se guardan localmente junto al levantamiento y se incluyen en el respaldo JSON. Al reemplazar las láminas, se restablece el estado de revisión del plano. La versión guardada del plan conserva las láminas con las que se generó. Verificar la legibilidad del plano a escala de impresión.
