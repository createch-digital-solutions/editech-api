import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../modules/queue/queue.constants.js';
import { PrismaService } from '../modules/prisma/prisma.service.js';
import { QueueService } from '../modules/queue/queue.service.js';

export interface VideoTranscodeJobPayload {
  lessonId: string;
  sourceKey: string;
  courseId: string;
}

@Injectable()
@Processor(QUEUE_NAMES.VIDEO)
export class VideoTranscodeProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoTranscodeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async process(
    job: Job<VideoTranscodeJobPayload, unknown, string>,
  ): Promise<unknown> {
    this.logger.log(
      `Processing video transcoding job ${job.id} for lesson: ${job.data?.lessonId}`,
    );

    if (job.name === JOB_NAMES.VIDEO.TRANSCODE) {
      const { lessonId, sourceKey } = job.data;

      // Phase 14 Flow B: FFmpeg transcoding stub producing HLS/multi-resolution streams
      this.logger.log(
        `Transcoding video source [${sourceKey}] for lesson ${lessonId}`,
      );

      return {
        transcoded: true,
        lessonId,
        hlsPlaylistUrl: `https://pub-r2.editech.internal/${sourceKey}/playlist.m3u8`,
        completedAt: new Date().toISOString(),
      };
    }

    return { unhandled: true };
  }
}
