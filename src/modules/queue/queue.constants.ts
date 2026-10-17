export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  PAYMENTS: 'payments-queue',
  VIDEO: 'video-transcode-queue',
  AI_COURSE: 'ai-course-builder-queue',
  CERTIFICATES: 'certificates-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const JOB_NAMES = {
  EMAIL: {
    SEND_TRANSACTIONAL: 'send-transactional-email',
  },
  PAYMENTS: {
    PROCESS_WEBHOOK: 'process-payment-webhook',
    PROCESS_PAYOUT: 'process-instructor-payout',
  },
  VIDEO: {
    TRANSCODE: 'transcode-lesson-video',
  },
  AI_COURSE: {
    BUILD_OUTLINE: 'build-course-outline',
  },
  CERTIFICATES: {
    GENERATE_PDF: 'generate-certificate-pdf',
  },
} as const;
