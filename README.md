# ProyectoARTE - Instagram Generative Analyzer

Monolito con dos aplicaciones en el mismo repo:

- `backend/` -> FastAPI + WebSockets + Instaloader + Pillow
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
uvicorn main:app --reload
```

Servidor en `http://localhost:8000`.

### Endpoint REST

- `POST /analyze-profile`

Request:

```json
{
  "username": "usuario"
}
```

Response:

```json
{
  "process_id": "uuid"
}
```

### WebSocket

- `ws://localhost:8000/ws/{process_id}`

Eventos ejemplo:

```json
{
  "step": "batch_main_node",
  "progress": 70,
  "message": "Batch 2/5: dibujando nodo principal...",
  "image": "base64_string"
}
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación en `http://localhost:5173`.

## Flujo

1. Ingresas username.
2. Frontend llama `POST /analyze-profile`.
3. Frontend abre `ws://localhost:8000/ws/{process_id}`.
4. Backend ejecuta pipeline por etapas y envía progreso + imagen parcial en cada batch.
5. Frontend actualiza barra, estado e imagen en tiempo real.
