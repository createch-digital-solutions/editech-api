import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants.js';
import { resendClient } from '../../../common/clients/resend.client.js';

export interface EmailJobPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobPayload, unknown, string>): Promise<unknown> {
    this.logger.log(
      `Processing email job ${job.id} of type ${job.name} for ${job.data?.to}`,
    );

    if (job.name === JOB_NAMES.EMAIL.SEND_TRANSACTIONAL) {
      const { to, subject, html } = job.data;
      try {
        const result = await resendClient.sendEmail({ to, subject, html });
        this.logger.log(`Email job ${job.id} dispatched successfully`);
        return result;
      } catch (err) {
        this.logger.warn(
          `Email delivery stub / simulation for job ${job.id} to ${to}: ${err instanceof Error ? err.message : String(err)}`,
        );
        return { simulated: true, to, subject };
      }
    }

    this.logger.warn(`Unknown job name ${job.name} on ${QUEUE_NAMES.EMAIL}`);
    return { unhandled: true };
  }
}
