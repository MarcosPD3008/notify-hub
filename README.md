# MICRO.Notify

Microservicio NestJS para envío de notificaciones con patrón **Provider/Adapter**.

## Endpoints

- `GET /health`
- `GET /auth/qr`
- `POST /send`
- `GET /events/whatsapp/qr` (SSE configurable con `QR_STREAM_PATH`)
- `GET /docs` (Swagger UI liviano)
- `GET /docs-json` (OpenAPI JSON)

## Variables de entorno

Revisa `.env.example`.

## Ejecutar local

```bash
npm install
npm run start:dev
```

## Docker

```bash
docker compose up --build
```

El volumen `whatsapp-auth` persiste la sesión multi-dispositivo de Baileys en `/app/data/baileys-auth`.

## Pruebas

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```
