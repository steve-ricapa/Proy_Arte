# Consulta tecnica para destrabar Instaloader + FastAPI (403/401)

Estoy construyendo un monolito con:

- Backend: FastAPI + Instaloader + WebSocket
- Frontend: React (Vite)
- Objetivo: analizar perfiles de Instagram y generar imagen en tiempo real

El sistema ya funciona en arquitectura, pero falla por restricciones de Instagram.

## Contexto actual (hechos observados)

1. El backend responde y el websocket funciona.
2. El endpoint `/analyze-profile` devuelve `process_id` correctamente.
3. Al consultar Instagram con Instaloader aparece:
   - `403 Forbidden` en GraphQL
   - `401 Unauthorized - Please wait a few minutes before you try again`
4. A veces aparece `Wrong password`, aunque en navegador el login sí funciona.
5. También apareció `Checkpoint required`, se aprobó manualmente en navegador.
6. Se implementó login por `.env` y carga de sesión desde archivo, pero igual persiste bloqueo temporal.

## Lo que ya implementé en código

- Carga de `.env` en backend.
- Variables:
  - `INSTAGRAM_LOGIN_USERNAME`
  - `INSTAGRAM_LOGIN_PASSWORD`
  - `INSTAGRAM_SESSION_FILE`
- Intento de login automático al iniciar backend.
- Carga de sesión persistente si existe.
- Endpoint de diagnóstico `GET /auth-status`.
- Mensajes de error más explícitos (403, login required, checkpoint URL completa).
- Soporte de WebSocket correcto en uvicorn (`uvicorn[standard]` + `websockets`).

## Necesito respuesta concreta sobre estas preguntas

1. **Alternativas a Instaloader**
   - ¿Qué librerías/API son viables hoy para metadata pública de Instagram?
   - ¿Qué opción es más estable/legal para producción?

2. **Estrategia robusta anti-bloqueo**
   - ¿Cómo diseñar un flujo con backoff real, cooldown y circuit breaker para no gatillar bloqueos?
   - ¿Qué umbrales recomendarías (retries, tiempos, ventanas)?

3. **Sesión autenticada confiable**
   - ¿Mejor práctica actual: login por credenciales, sesión guardada, cookies exportadas del navegador, o combinación?
   - ¿Cómo refrescar sesión sin intervención manual frecuente?

4. **Detección de errores de Instagram**
   - ¿Cómo mapear de forma precisa errores 401/403/checkpoint/wrong password falso?
   - Quiero una tabla de decisión: error detectado -> acción automática recomendada.

5. **Arquitectura recomendada para este caso**
   - ¿Conviene desacoplar la extracción en worker/cola (Celery/RQ/Redis) para controlar rate-limit?
   - ¿Qué patrón usar para multiusuario simultáneo sin castigar una sola IP?

6. **Opción oficial/meta**
   - Si Instaloader no es confiable para este caso, ¿qué endpoints oficiales de Meta (Graph API) pueden sustituir parte del análisis?
   - ¿Qué datos sí/no se obtienen oficialmente?

7. **Plan práctico de migración**
   - Dame un plan en fases (MVP -> estable -> productivo) para pasar de scraping frágil a solución confiable.

## Lo que espero como respuesta

- Recomendación técnica priorizada (A/B/C) con trade-offs.
- Ejemplo de implementación de manejo de rate-limit (pseudo o código Python).
- Estrategia concreta para mi caso local (dev) y para producción.
- Señalar explícitamente qué partes dependen de políticas de Instagram y no de bugs del código.
