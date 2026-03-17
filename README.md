# MICRO.Notify

MICRO.Notify es un robusto microservicio fuertemente tipado en NestJS diseñado para unificar y facilitar el envío de notificaciones multiplataforma utilizando un patrón de arquitectura **Provider/Adapter**. 

Su objetivo principal es ofrecer una API unificada (`POST /send`), permitiendo la fácil y limpia integración de múltiples canales de comunicación y proveedores de notificaciones en un solo punto de entrada. Incluye de forma nativa soporte para [WhatsApp Asíncrono](./flows/whatsapp.md) con envío de texto y archivos (URL o base64), envío programado, autenticación QR via SSE y reconexión automática.

## Características Principales

- **Arquitectura Extensible**: Factory + Adapter pattern — agregar SMS, Email u otro proveedor sin tocar el núcleo.
- **WhatsApp nativo**: Conexión Multi-Device via Baileys, sin APIs de pago. Sesión persistente en volumen Docker.
- **Envío de archivos**: Imágenes, videos, audios y documentos via URL o base64. Mimetype auto-detectado desde `Content-Type`.
- **Envío programado**: Campo `scheduleTime` (ISO 8601) para encolar jobs con delay exacto en Redis/BullMQ.
- **Reconexión automática**: Backoff exponencial configurable ante desconexiones de WhatsApp.
- **Documentación Completa**: Swagger UI en `/docs` con esquemas OpenAPI.

---

## Flujos de Mensajes (Message Flows)

Para comprender cómo interactúa internamente el servicio, la plataforma y el cliente mediante eventos con cada proveedor pre-instalado, checa la siguiente guía detallada:

- [Flujo de Autenticación y Envío nativo de WhatsApp](./flows/whatsapp.md)

---

## Endpoints Integrados

Puedes ver la documentación interactiva provista tras compilar accediendo localmente en la sub-ruta principal de Swagger UI:

- `GET /docs` (Swagger UI Interactivo con auto-descubrimiento)
- `GET /docs-json` (Specification OpenAPI pura de los DTOs)

Las operativas internas del proyecto consisten en:
- `POST /send` — Punto de entrada universal. Acepta `provider`, `data` y `scheduleTime` (opcional).
- `GET /health` — Estado de conexión y latencia de cada proveedor registrado.
- `GET /auth/qr` — Página HTML con el QR actual de WhatsApp.
- `GET /events/whatsapp/qr` — Stream SSE con rotación de QR en tiempo real (heartbeat cada 15 s).

## Entorno Local

Asegúrate de copiar tu archivo enrutador de variables predeterminadas:
(Guíate utilizando el `.env.example`)

Para la de inicialización en desarrollo, descarga los paquetes de `package.json` utilizando NPM y corre el módulo en escucha interactiva:

```bash
npm install
npm run start:dev
```

## Contenedores Docker

La aplicación cuenta con su propia imagen productiva de NodeJS dist. Adicionalmente, recomendamos Docker debido al manejo aislado de su volumen para evitar la pérdida en la sesión asíncrona de WhatsApp nativo:

```bash
docker compose up --build
```

> **Volumen de sesión interno**: Utilizar Docker Compose generará el volumen montado llamado `whatsapp-auth` el cual encarga de evitar deslogueos indeseados e interrupciones del hilo de sesión de Baileys re-alojándola en la ruta productiva interna `/app/data/baileys-auth`.

## Pruebas de Calidad

Para validar el formato de todos los schemas (limpieza Eslint) tanto estricto Type-Safety como correr en el runtime todos los comandos analíticos y E2E provistos para testing de endpoints:

```bash
npm run format
npm run lint
npm run build
npm test
npm run test:e2e
```
