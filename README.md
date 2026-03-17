# MICRO.Notify

MICRO.Notify es un robusto microservicio fuertemente tipado en NestJS diseñado para unificar y facilitar el envío de notificaciones multiplataforma utilizando un patrón de arquitectura **Provider/Adapter**. 

Su objetivo principal es ofrecer una API unificada (`POST /send`), permitiendo la fácil y limpia integración de múltiples canales de comunicación y proveedores de notificaciones en un solo punto de entrada. Incluye de forma nativa soporte para [WhatsApp Asíncrono](#1-flujo-de-whatsapp) con manejo automático de eventos, autenticación asíncrona, rotación de códigos QR mediante Server-Sent Events (SSE) y esquema validado DTOs.

## Características Principales

- **Arquitectura Extensible y Escalable**: Gracias a su uso interno de *Factory Patterns* y adaptadores agnósticos, te permite añadir nuevos proveedores (SMS, Resend, SendGrid) sin apenas tocar la lógica modular del núcleo base.
- **Micro-Integración de WhatsApp**: Utiliza la conexión nativa socket *Multi-Device* mediante Baileys con persistencia y manejo del estado integrado sin depender de servicios pagos.
- **Documentación Completa**: Los controladores utilizan los estándares de decoración `@nestjs/swagger` y brindan UI dinámicas sin esfuerzo y esquemas de OpenApi.

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
- `GET /health` : Obtiene el estado de saludo general del servidor y de los proveedores mapeados con sus latencias de conexión.
- `GET /auth/qr` : Endpoint que da respuesta HTML para simular y previsualizar de forma en crudo el código QR activo.
- `GET /events/whatsapp/qr` : Endpoint reactivo para flujos asíncronos en clientes basados en eventos que devuelve un stream de actualización y de latido (SSE).
- `POST /send` : Punto de entrada agnóstico universal para enviar notificaciones utilizando el cuerpo DTO del request.

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
