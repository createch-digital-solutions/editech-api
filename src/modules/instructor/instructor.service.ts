import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from '../s3/s3.service.js';

@Injectable()
export class InstructorService {
  private readonly logger = new Logger(InstructorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  getHealth() {
    return { status: 'ok', module: 'instructor' };
  }

  /**
   * Phase 14 Flow B (Step 2): Generate pre-signed Cloudflare R2 upload URL for lesson video
   */
  async getLessonUploadUrl(
    userId: string,
    lessonId: string,
    contentType = 'video/mp4',
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: `Lesson with id ${lessonId} does not exist`,
      });
    }

    if (lesson.course.instructor.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have permission to upload videos for this course',
      });
    }

    const key = `courses/${lesson.courseId}/lessons/${lesson.id}/raw.mp4`;
    const presigned = await this.s3Service.getUploadPresignedUrl(
      key,
      contentType,
      900,
    );

    return {
      uploadUrl: presigned.uploadUrl,
      key: presigned.key,
      expiresIn: presigned.expiresIn,
      lessonId: lesson.id,
    };
  }

  /**
   * Phase 14 Flow B (Step 5/6): Direct upload to R2 completed by browser
   */
  async completeLessonUpload(userId: string, lessonId: string, key: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: `Lesson with id ${lessonId} does not exist`,
      });
    }

    if (lesson.course.instructor.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this course',
      });
    }

    // Verify presence in storage
    const exists = await this.s3Service.fileExists(key);
    this.logger.log(
      `Verified video presence for lesson ${lessonId}: ${exists}`,
    );

    // Update lesson video URL
    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: key,
      },
    });

    return {
      success: true,
      message: 'Video upload completed and registered',
      lessonId: updated.id,
      videoUrl: updated.videoUrl,
    };
  }
}
