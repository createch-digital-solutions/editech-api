import { Module, Global, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants.js';
import { QueueService } from './queue.service.js';

const logger = new Logger('QueueModule');

const getRetryStrategy = () => (times: number) => {
  // Graceful backoff so an unreachable Redis never floods CPU or crashes the Node process
  const delay = Math.min(times * 1000, 10000);
  if (times <= 3) {
    logger.warn(
      `[Redis Connection] Attempt ${times} failed. Retrying in ${delay}ms... (Ensure REDIS_URL is configured)`,
    );
  }
  return delay;
};

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const retryStrategy = getRetryStrategy();

        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            const isTls = parsed.protocol === 'rediss:';
            logger.log(
              `BullMQ connecting via REDIS_URL to ${parsed.hostname}:${parsed.port || 6379} (TLS: ${isTls})`,
            );

            return {
              connection: {
                host: parsed.hostname,
                port: parseInt(parsed.port, 10) || 6379,
                username: parsed.username
                  ? decodeURIComponent(parsed.username)
                  : undefined,
                password: parsed.password
                  ? decodeURIComponent(parsed.password)
                  : undefined,
                tls: isTls ? { rejectUnauthorized: false } : undefined,
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                connectTimeout: 10000,
                retryStrategy,
              },
            };
          } catch (err) {
            logger.error(`Invalid REDIS_URL format: ${err}`);
          }
        }

        const host = configService.get<string>('REDIS_HOST') || '127.0.0.1';
        const port = Number(configService.get<number>('REDIS_PORT')) || 6379;
        const password = configService.get<string>('REDIS_PASSWORD') || undefined;

        logger.log(
          `BullMQ configured with fallback host: ${host}:${port} (Set REDIS_URL on Render/Upstash for production)`,
        );

        return {
          connection: {
            host,
            port,
            password,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            connectTimeout: 5000,
            retryStrategy,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
      },
      {
        name: QUEUE_NAMES.PAYMENTS,
      },
      {
        name: QUEUE_NAMES.VIDEO,
      },
      {
        name: QUEUE_NAMES.AI_COURSE,
      },
      {
        name: QUEUE_NAMES.CERTIFICATES,
      },
    ),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
