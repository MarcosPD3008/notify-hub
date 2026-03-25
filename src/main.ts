import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './auth/guards/api-key.guard';

function resolvePath(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.startsWith('/') ? value : `/${value}`;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ── Global auth guard ──────────────────────────────────────────────────────
  // Use DI-resolved instance so ApiKeyService and Reflector are properly injected.
  // Routes decorated with @Public() bypass authentication automatically.
  app.useGlobalGuards(app.get(ApiKeyGuard));

  // ── Swagger ────────────────────────────────────────────────────────────────
  const docsPath = resolvePath(process.env.SWAGGER_PATH, '/docs');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MICRO.Notify API')
    .setDescription(
      'Microservicio de notificaciones multi-canal con arquitectura Provider/Adapter.\n\n' +
        '**Autenticación:** incluye el header `X-Api-Key` en cada request. ' +
        'Usa el botón **Authorize** para configurarlo globalmente en Swagger.\n\n' +
        'Las rutas de health y QR son públicas.',
    )
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
      'X-Api-Key',
    )
    .addSecurityRequirements('X-Api-Key')
    .build();

  const nestDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(docsPath, app, nestDoc, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
