import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function resolvePath(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const docsPath = resolvePath(process.env.SWAGGER_PATH, '/docs');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MICRO.Notify API')
    .setDescription(
      'Microservicio de notificaciones con arquitectura Provider/Adapter.',
    )
    .setVersion('1.0.0')
    .build();

  const nestDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(docsPath, app, nestDoc);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
