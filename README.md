# The Obligation to Shine

Obra digital interactiva que transforma la actividad de un perfil de Instagram en una constelacion generativa. El proyecto traduce publicaciones, fechas, interacciones, hashtags y menciones en un sistema celeste donde cada post aparece como un cuerpo luminoso dentro de una cartografia de presencia digital.

## Idea

**The Obligation to Shine** explora la presion contemporanea de permanecer visibles. En las redes, cada publicacion funciona como una emision de luz: una busqueda de atencion, pertenencia y permanencia. La obra convierte esa logica en una constelacion donde el brillo no representa solo belleza, sino tambien exposicion, desgaste y la necesidad constante de seguir presentes.

La pieza propone una lectura critica de la vida social digital: no solo publicamos para comunicar, sino para sostener una visibilidad dentro de un flujo continuo de aparicion y olvido.

## Contexto academico

Este proyecto fue desarrollado como trabajo academico de la **UTEC**, para el curso **Arte y Tecnologia**, ciclo **2026-1**.

## Estructura del proyecto

Monolito con dos aplicaciones en el mismo repositorio:

- `backend/` -> FastAPI + Apify
- `frontend/` -> React + Vite + p5.js

```text
.
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ core/
│  ├─ models/
│  ├─ routes/
│  └─ services/
├─ frontend/
│  ├─ package.json
│  ├─ Dockerfile
│  └─ src/
└─ docker-compose.yml
```

## Como funciona

1. El usuario ingresa un username de Instagram.
2. El frontend llama a `POST /analyze-profile`.
3. El backend extrae datos del perfil usando Apify.
4. La API devuelve un payload completo en una sola respuesta.
5. El frontend transforma ese payload en una obra generativa renderizada en p5.js.

## Backend local

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload
```

Servidor en `http://localhost:8000`.

### Endpoint principal

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

### Estado del extractor

- `GET /auth-status`
- `GET /extractor-status`

## Frontend local

```bash
cd frontend
npm install
npm run dev
```

Aplicacion en `http://localhost:5173`.

## Variables de entorno del backend

Configura `backend/.env`:

```bash
APIFY_TOKEN=your_apify_token_here
APIFY_ACTOR_ID=apify~instagram-scraper
APIFY_POSTS_LIMIT=12
APIFY_TIMEOUT_SECONDS=180
ANALYZE_USE_MOCK=false
ANALYZE_MOCK_DELAY_MS=500
ANALYZE_MOCK_POSTS=50
```

## Stress test sin Apify

Para hacer pruebas de carga sin tocar Apify, activa el modo mock en `backend/.env`:

```bash
ANALYZE_USE_MOCK=true
ANALYZE_MOCK_DELAY_MS=500
ANALYZE_MOCK_POSTS=50
```

Eso hace que `POST /analyze-profile` devuelva un payload local con el mismo formato del endpoint real, pero sin llamadas externas.

Script incluido:

- `tests/stress/analyze-profile.k6.js`

Ejemplo con `k6`:

```bash
k6 run tests/stress/analyze-profile.k6.js
```

Opcionalmente:

```bash
BASE_URL=http://localhost:8000 LIMIT=50 USERNAME_PREFIX=stress.demo k6 run tests/stress/analyze-profile.k6.js
```

El script lanza 10 usuarios concurrentes durante 1 minuto y verifica que el endpoint responda con status `200` y con un payload valido.

## Deploy rapido con Docker Compose

El proyecto incluye:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`

Para levantarlo en una sola maquina:

```bash
docker compose up -d --build
```

Por defecto:

- frontend en `http://localhost:8080`
- backend en `http://localhost:8000`

## Prueba rapida con curl

```bash
curl -X POST http://localhost:8000/analyze-profile \
  -H "Content-Type: application/json" \
  -d '{"username":"humansofny","limit":12}'
```
