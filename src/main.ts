import { NestFactory } from '@nestjs/core';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './docs/openapi';
import { ProviderStateService } from './notifications/services/provider-state.service';

function resolvePath(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as {
    get: (path: string, handler: (req: Request, res: Response) => void) => void;
  };

  const qrStreamPath = resolvePath(
    process.env.QR_STREAM_PATH,
    '/events/whatsapp/qr',
  );
  const openApiPath = resolvePath(process.env.SWAGGER_JSON_PATH, '/docs-json');
  const docsPath = resolvePath(process.env.SWAGGER_PATH, '/docs');

  const providerState = app.get(ProviderStateService);

  expressApp.get(openApiPath, (_req, res) => {
    res.json(createOpenApiDocument(qrStreamPath));
  });

  expressApp.get(docsPath, (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>MICRO.Notify Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '${openApiPath}',
        dom_id: '#swagger-ui'
      });
    </script>
  </body>
</html>`);
  });

  expressApp.get(qrStreamPath, (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const writeQrEvent = (qr: string | null): void => {
      const payload = JSON.stringify({ provider: 'whatsapp', qr });
      res.write(`event: qr\n`);
      res.write(`data: ${payload}\n\n`);
    };

    writeQrEvent(providerState.getQr('whatsapp'));

    const unsubscribe = providerState.onQrUpdate('whatsapp', (qr) => {
      writeQrEvent(qr);
    });

    const heartbeat = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 15000);

    res.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
