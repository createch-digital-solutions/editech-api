import { Module } from '@nestjs/common';
import { EmailProcessor } from './email.processor.js';
import { PayoutProcessor } from './payout.processor.js';
import { VideoTranscodeProcessor } from './video-transcode.processor.js';
import { AiCourseBuilderProcessor } from './ai-course-builder.processor.js';
import { CertificateProcessor } from './certificate.processor.js';

@Module({
  providers: [
    EmailProcessor,
    PayoutProcessor,
    VideoTranscodeProcessor,
    AiCourseBuilderProcessor,
    CertificateProcessor,
  ],
  exports: [
    EmailProcessor,
    PayoutProcessor,
    VideoTranscodeProcessor,
    AiCourseBuilderProcessor,
    CertificateProcessor,
  ],
})
export class JobsModule {}
