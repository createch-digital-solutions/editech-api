import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../modules/queue/queue.constants.js';
import { PrismaService } from '../modules/prisma/prisma.service.js';
import { AiService } from '../modules/ai/ai.service.js';
import { CourseStatus, LessonType } from '@prisma/client';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
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

      // 1. Resolve instructor profile
      const instructor = await this.prisma.instructorProfile.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new Error(`Instructor profile '${instructorId}' not found.`);
      }

      // 2. Generate structured syllabus using AI SDK
      const scaffold = await this.aiService.generateCourseScaffold({ prompt });

      // 3. Generate unique slug
      const baseSlug = scaffold.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const slug = `${baseSlug}-${randomSuffix}`;

      // 4. Persist Course, Sections, Lessons, and Quizzes into PostgreSQL
      const createdCourse = await this.prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            instructorId: instructor.id,
            title: scaffold.title,
            slug,
            description: scaffold.description,
            category: scaffold.category,
            level: scaffold.level,
            outcomeTag: scaffold.outcomeTag,
            tags: scaffold.tags,
            price: 35000,
            status: CourseStatus.DRAFT,
          },
        });

        for (const sec of scaffold.sections) {
          const section = await tx.courseSection.create({
            data: {
              courseId: course.id,
              title: sec.title,
              position: sec.position,
            },
          });

          for (const les of sec.lessons) {
            const lesson = await tx.lesson.create({
              data: {
                courseId: course.id,
                sectionId: section.id,
                title: les.title,
                position: les.position,
                type: les.type,
                videoDuration:
                  les.type === LessonType.VIDEO
                    ? les.estimatedDuration * 60
                    : null,
                content:
                  les.type === LessonType.TEXT ? les.contentSummary : null,
                isPublished: false,
              },
            });

            if (les.type === LessonType.QUIZ && les.quizQuestions?.length) {
              const quiz = await tx.quiz.create({
                data: {
                  courseId: course.id,
                  lessonId: lesson.id,
                  title: `${les.title} Evaluation`,
                  passMark: 70,
                },
              });

              for (const [qIndex, q] of les.quizQuestions.entries()) {
                await tx.quizQuestion.create({
                  data: {
                    quizId: quiz.id,
                    questionText: q.questionText,
                    options: q.options,
                    position: qIndex + 1,
                  },
                });
              }
            }
          }
        }

        return course;
      });

      this.logger.log(
        `AI Course Builder successfully created course "${createdCourse.title}" (${createdCourse.id})`,
      );

      return {
        completed: true,
        courseId: createdCourse.id,
        courseSlug: createdCourse.slug,
        title: createdCourse.title,
      };
    }

    return { unhandled: true };
  }
}
