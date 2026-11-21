import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from './queue.constants.js';
import type { EmailJobPayload } from '../../jobs/email.processor.js';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue: Queue<EmailJobPayload>,
  ) {}

  /**
   * Queue a transactional email to be sent asynchronously via Resend
   */
  async queueEmail(payload: EmailJobPayload) {
    this.logger.log(`Enqueueing transactional email to: ${payload.to}`);
    try {
      return await this.emailQueue.add(
        JOB_NAMES.EMAIL.SEND_TRANSACTIONAL,
        payload,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue email to ${payload.to} (Redis offline / degraded): ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
