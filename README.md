# ProyectoARTE - Instagram Generative Analyzer

Monolito con dos aplicaciones en el mismo repo:

- `backend/` -> FastAPI + Apify + Pillow
- `frontend/` -> React + Vite

## Estructura

```text
.
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ utils/
│  └─ websocket/
└─ frontend/
   ├─ package.json
   ├─ index.html
   ├─ vite.config.js
   └─ src/
      ├─ App.jsx
      └─ components/
```

## Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Configurar variables de entorno
copy .env.example .env
uvicorn main:app --reload
```

Servidor en `http://localhost:8000`.

### Endpoint REST

- `POST /analyze-profile`

Request:

```json
{
  "username": "humansofny",
  "limit": 12
}
```

Response:

```json
{
  "source": "apify",
  "status": "success",
  "username": "humansofny",
  "generated_at": "2026-05-28T10:25:30.100000+00:00",
  "profile": {},
  "metadata": {},
  "metrics": {},
  "analysis": {},
  "posts": [],
  "render_hints": {}
}
```

### WebSocket

- El frontend ya no usa WebSocket. El flujo es one-shot por `POST /analyze-profile`.

Eventos ejemplo:

```json
{
  "step": "batch_main_node",
  "progress": 70,
  "message": "Batch 2/5: dibujando nodo principal...",
  "image": "base64_string"
}
```

### Estado extractor

- `GET /auth-status`: estado de configuracion del extractor Apify.
- `GET /extractor-status`: estado completo (auth + cooldown global/perfil).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación en `http://localhost:5173`.

## Flujo

1. Ingresas username (tambien acepta `@username` o URL de Instagram).
2. Frontend llama `POST /analyze-profile`.
3. Backend extrae posts con Apify y devuelve un payload completo (metadata, analisis y posts) en una sola respuesta.
4. Frontend puede transformar ese payload en visualizaciones/arte con la libreria que prefieras.

## Variables backend (.env)

- Usa `backend/.env`:

```bash
APIFY_TOKEN=your_apify_token_here
APIFY_ACTOR_ID=apify~instagram-scraper
APIFY_POSTS_LIMIT=12
APIFY_TIMEOUT_SECONDS=180
```

## Prueba rápida con curl

```bash
curl -X POST http://localhost:8000/analyze-profile \
  -H "Content-Type: application/json" \
  -d '{"username":"humansofny","limit":12}'
```
