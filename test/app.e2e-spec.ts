import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

interface HealthResponseBody {
  status: string;
  services: Record<string, unknown>;
}

describe('Health E2E Test', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/health')
      .expect(200)
      .expect((res: { body: HealthResponseBody }) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.services).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
