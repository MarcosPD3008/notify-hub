import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface HealthResponse {
  status: string;
  providers: {
    whatsapp: {
      status: string;
      latency: string;
    };
  };
}

describe('MICRO.Notify (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const health = response.body as HealthResponse;

    expect(health.status).toBe('up');
    expect(health.providers.whatsapp.status).toBeDefined();
  });

  it('/auth/qr (GET)', () => {
    return request(app.getHttpServer()).get('/auth/qr').expect(200);
  });

  it('/send (POST) invalid whatsapp payload', () => {
    return request(app.getHttpServer())
      .post('/send')
      .send({ provider: 'whatsapp', data: { to: '1234', message: 123 } })
      .expect(400);
  });
});
