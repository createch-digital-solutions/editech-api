import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../modules/queue/queue.constants.js';
import { PrismaService } from '../modules/prisma/prisma.service.js';

export interface CertificateJobPayload {
  enrollmentId: string;
  courseId: string;
  userId: string;
}

@Injectable()
@Processor(QUEUE_NAMES.CERTIFICATES)
export class CertificateProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificateProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<CertificateJobPayload, unknown, string>,
  ): Promise<unknown> {
    this.logger.log(
      `Processing certificate generation job ${job.id} for user: ${job.data?.userId}`,
    );

    if (job.name === JOB_NAMES.CERTIFICATES.GENERATE_PDF) {
      const { enrollmentId, courseId, userId } = job.data;
      this.logger.log(
        `Compiling PDF certificate for user ${userId}, course ${courseId}, enrollment ${enrollmentId}`,
      );

      return {
        generated: true,
        certificateUrl: `https://pub-r2.editech.internal/certificates/${enrollmentId}.pdf`,
        completedAt: new Date().toISOString(),
      };
    }

    return { unhandled: true };
  }
}
