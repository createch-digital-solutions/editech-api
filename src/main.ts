import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { initServerSentry } from './common/clients/sentry.client.js';

async function bootstrap() {
  // Initialize Sentry server telemetry
  initServerSentry();

  // Enable rawBody preservation for Svix / Paystack / Stripe webhooks
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global Routing Prefix (Phase 15 Section 2.2)
  app.setGlobalPrefix('api/v1');

  // Global Pipes, Filters, and Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger / OpenAPI Specification
  const config = new DocumentBuilder()
    .setTitle('Createch Learning Platform REST API')
    .setDescription(
      'Contract and documentation for the Createch learning marketplace backend services.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  logger.log(`Createch API server running on port: ${port}`);
  logger.log(`API base route: http://localhost:${port}/api/v1`);
  logger.log(`OpenAPI documentation live at: http://localhost:${port}/docs`);
}
void bootstrap();
