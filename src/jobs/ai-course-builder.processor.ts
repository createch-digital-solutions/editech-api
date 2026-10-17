import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../modules/queue/queue.constants.js';
import { PrismaService } from '../modules/prisma/prisma.service.js';

export interface AiCourseBuilderJobPayload {
  prompt: string;
  instructorId: string;
  targetAudience?: string;
  outlineId?: string;
}

@Injectable()
@Processor(QUEUE_NAMES.AI_COURSE)
export class AiCourseBuilderProcessor extends WorkerHost {
  private readonly logger = new Logger(AiCourseBuilderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<AiCourseBuilderJobPayload, unknown, string>,
  ): Promise<unknown> {
    this.logger.log(
      `Processing AI Course Builder job ${job.id} for instructor: ${job.data?.instructorId}`,
    );

    if (job.name === JOB_NAMES.AI_COURSE.BUILD_OUTLINE) {
      const { prompt, instructorId } = job.data;
      this.logger.log(
        `Generating curriculum scaffold for prompt: "${prompt}" (instructor: ${instructorId})`,
      );

      return {
        completed: true,
        instructorId,
        scaffoldGenerated: true,
        completedAt: new Date().toISOString(),
      };
    }

    return { unhandled: true };
  }
}
