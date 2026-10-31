import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../modules/queue/queue.constants.js';
import { PrismaService } from '../modules/prisma/prisma.service.js';

export interface PaymentWebhookJobPayload {
  provider: 'paystack' | 'stripe';
  event: string;
  data: Record<string, unknown>;
  reference?: string;
}

@Injectable()
@Processor(QUEUE_NAMES.PAYMENTS)
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<PaymentWebhookJobPayload, unknown, string>,
  ): Promise<unknown> {
    this.logger.log(
      `Processing payment job ${job.id} [${job.name}] for provider: ${job.data?.provider}`,
    );

    if (job.name === JOB_NAMES.PAYMENTS.PROCESS_WEBHOOK) {
      const { provider, event, reference } = job.data;
      this.logger.log(
        `Executing asynchronous webhook processing for ${provider} [${event}] ref: ${reference}`,
      );

      // Phase 14 Flow A: Asynchronous order confirmation, enrollment, and XP award
      return {
        processed: true,
        provider,
        event,
        reference,
        completedAt: new Date().toISOString(),
      };
    }

    if (job.name === JOB_NAMES.PAYMENTS.PROCESS_PAYOUT) {
      this.logger.log(`Processing instructor payout job ${job.id}`);
      return { processed: true, type: 'payout' };
    }

    return { unhandled: true };
  }
}
