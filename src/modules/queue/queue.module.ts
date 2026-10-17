import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants.js';
import { QueueService } from './queue.service.js';
import { EmailProcessor } from './processors/email.processor.js';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parseInt(parsed.port, 10) || 6379,
              username: parsed.username || undefined,
              password: parsed.password || undefined,
            },
          };
        }

        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
            port: Number(configService.get<number>('REDIS_PORT')) || 6379,
            password: configService.get<string>('REDIS_PASSWORD') || undefined,
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
  providers: [QueueService, EmailProcessor],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
