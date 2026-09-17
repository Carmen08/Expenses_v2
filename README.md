# Expenses_v2 — Docker usage

Resúmen rápido: este repo tiene `frontend` (React + Vite) y `backend` (Express). Hay Dockerfiles y compose para desarrollo y producción.

Archivos importantes:
- [docker-compose.yml](docker-compose.yml) — configuración base (producción)
- [docker-compose.prod.yml](docker-compose.prod.yml) — compose orientado a producción (incluye secreto Firebase)
- [docker-compose.override.yml](docker-compose.override.yml) — sobreescribe para desarrollo (monta código y usa dev servers)
- [frontend/Dockerfile](frontend/Dockerfile) — multi-stage, sirve con Nginx
- [backend/Dockerfile](backend/Dockerfile) — imagen Node para backend

Requisitos:
- Docker Engine y Docker Compose V2 (comando `docker compose`)

Comandos útiles

Desarrollo (usa `docker-compose.override.yml` automáticamente):
```bash
docker compose up --build
```

Producción (usa el fichero de producción):
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Construir imágenes manualmente:
```bash
docker build -f frontend/Dockerfile -t expenses-frontend:latest frontend
docker build -f backend/Dockerfile -t expenses-backend:latest backend
```

Ejecutar backend localmente montando la credencial de Firebase (sin secrets manager):
```bash
docker run --rm -p 4000:4000 \
  -v /ruta/en/host/serviceAccountKey.json:/run/secrets/serviceAccount.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/serviceAccount.json \
  expenses-backend:latest
```

Uso de Docker secrets (recomendado en producción con `docker-compose.prod.yml`):
- Coloca tu fichero JSON en `secrets/serviceAccountKey.json` (NO lo incluyas en el repo).
- `docker-compose.prod.yml` ya declara este secreto y monta `/run/secrets/firebase_sa` dentro del servicio `backend`.

Notas sobre Firebase credentials
- El backend acepta dos formas (ver `src/firebaseAdmin.js`):
  - `GOOGLE_APPLICATION_CREDENTIALS` como ruta a un fichero JSON dentro del contenedor.
  - `FIREBASE_SERVICE_ACCOUNT_JSON` con el JSON completo en la variable de entorno.
- Evita commitear el JSON al repo. Usa mounts locales para desarrollo o Docker secrets en producción.

