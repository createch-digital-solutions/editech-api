import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { generateObject, streamText } from 'ai';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiProvider } from './ai.provider.js';
import {
  CourseScaffoldSchema,
  type CourseScaffold,
} from './dto/course-scaffold.dto.js';
import { GenerateCourseDto } from './dto/generate-course.dto.js';
import { TutorChatDto } from './dto/tutor-chat.dto.js';
import {
  COURSE_BUILDER_SYSTEM_PROMPT,
  buildCourseScaffoldUserPrompt,
  buildTutorSystemPrompt,
} from './prompts/index.js';
import type { Response } from 'express';
import { CourseLevel, OutcomeTag, LessonType } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AiProvider,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      module: 'ai',
      provider: 'google-gemini',
      configured: this.aiProvider.hasValidKey(),
    };
  }

  /**
   * Generates a complete, structured course outline with modules, lessons, and quizzes.
   */
  async generateCourseScaffold(dto: GenerateCourseDto): Promise<CourseScaffold> {
    const model = this.aiProvider.getModel();

    if (!model) {
      this.logger.warn(
        'AI Provider not configured. Returning deterministic scaffold stub for development.',
      );
      return this.generateStubScaffold(dto);
    }

    const systemPrompt = COURSE_BUILDER_SYSTEM_PROMPT;
    const userPrompt = buildCourseScaffoldUserPrompt({
      prompt: dto.prompt,
      level: dto.level,
      outcomeTag: dto.outcomeTag,
      category: dto.category,
    });

    const { object } = await generateObject({
      model,
      schema: CourseScaffoldSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return object;
  }

  /**
   * Streams conversational response with Aria (The AI Learning Coach)
   * Enforces Dual-Scope Paywall & Enrollment Security
   */
  async streamTutorChat(
    learnerId: string,
    dto: TutorChatDto,
    res: Response,
  ): Promise<void> {
    const model = this.aiProvider.getModel();

    // 1. Dual-Scope Security Guardrail: Check Enrollment if scoped to a course or lesson
    let courseTitle: string | undefined;
    let lessonTitle: string | undefined;
    let lessonType: string | undefined;
    let lessonContent: string | null | undefined;

    if (dto.courseId) {
      const enrolment = await this.prisma.enrolment.findUnique({
        where: {
          learnerId_courseId: {
            learnerId,
            courseId: dto.courseId,
          },
        },
        include: {
          course: { select: { title: true, category: true } },
        },
      });

      if (!enrolment || enrolment.status !== 'ACTIVE') {
        throw new ForbiddenException(
          'You must be actively enrolled in this course to access the in-classroom AI tutor.',
        );
      }

      courseTitle = enrolment.course.title;

      if (dto.lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: dto.lessonId },
          select: { title: true, type: true, content: true },
        });

        if (!lesson) {
          throw new NotFoundException('Lesson not found.');
        }

        lessonTitle = lesson.title;
        lessonType = lesson.type;
        lessonContent = lesson.content;
      }
    }

    // 2. Build Persona & Scope System Prompt from prompt utility
    const systemPrompt = buildTutorSystemPrompt({
      persona: dto.persona,
      courseTitle,
      lessonTitle,
      lessonType,
      lessonContent,
    });

    // 3. Fallback if model is not configured (stub streaming)
    if (!model) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      const fallbackReply =
        `Hello! I'm Aria, your learning coach. (AI Provider is currently in demo/stub mode: set GEMINI_API_KEY to activate live AI). ` +
        `Regarding your question, keep practicing and review the course material!`;
      res.write(fallbackReply);
      res.end();
      return;
    }

    // 4. Stream response using Vercel AI SDK
    const result = streamText({
      model,
      system: systemPrompt,
      messages: dto.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let fullReply = '';
    for await (const chunk of result.textStream) {
      fullReply += chunk;
      res.write(chunk);
    }
    res.end();

    // 5. Asynchronously persist conversation history
    this.persistConversation(
      learnerId,
      dto.courseId,
      dto.lessonId,
      dto.messages,
      fullReply,
    ).catch((err) => {
      this.logger.error('Failed to persist AI conversation', err);
    });
  }

  /**
   * Retrieves chat history for a learner
   */
  async getConversations(learnerId: string, lessonId?: string) {
    return this.prisma.aiConversation.findMany({
      where: {
        learnerId,
        ...(lessonId ? { lessonId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  private async persistConversation(
    learnerId: string,
    courseId?: string,
    lessonId?: string,
    history: TutorChatDto['messages'] = [],
    reply: string = '',
  ) {
    const updatedMessages = [
      ...history,
      { role: 'assistant', content: reply },
    ];

    const existing = await this.prisma.aiConversation.findFirst({
      where: {
        learnerId,
        courseId: courseId ?? null,
        lessonId: lessonId ?? null,
      },
    });

    if (existing) {
      await this.prisma.aiConversation.update({
        where: { id: existing.id },
        data: {
          messages: updatedMessages,
          tokenCount: { increment: Math.ceil((reply.length + 100) / 4) },
        },
      });
    } else {
      await this.prisma.aiConversation.create({
        data: {
          learnerId,
          courseId: courseId || null,
          lessonId: lessonId || null,
          messages: updatedMessages,
          tokenCount: Math.ceil((reply.length + 100) / 4),
        },
      });
    }
  }

  /**
   * Safe fallback scaffold generator for dev/tests without API key
   */
  private generateStubScaffold(dto: GenerateCourseDto): CourseScaffold {
    return {
      title: `${dto.prompt} - Complete Guide`,
      description: `Comprehensive course covering ${dto.prompt} with real-world architectures, hands-on projects, and production patterns.`,
      category: dto.category || 'Backend Development',
      level: dto.level || CourseLevel.INTERMEDIATE,
      outcomeTag: dto.outcomeTag || OutcomeTag.GET_A_JOB,
      tags: ['software-architecture', 'typescript', 'production'],
      sections: [
        {
          title: 'Section 1: Foundations & Architecture',
          position: 1,
          lessons: [
            {
              title: 'Introduction & Core Concepts',
              type: LessonType.VIDEO,
              position: 1,
              estimatedDuration: 12,
              contentSummary: 'Overview of system architecture and prerequisites.',
            },
            {
              title: 'Environment Setup & Docker Compose',
              type: LessonType.TEXT,
              position: 2,
              estimatedDuration: 15,
              contentSummary: 'Step-by-step setup guide with config files.',
            },
            {
              title: 'Module 1 Knowledge Check',
              type: LessonType.QUIZ,
              position: 3,
              estimatedDuration: 10,
              contentSummary: 'Evaluate foundational concepts.',
              quizQuestions: [
                {
                  questionText: 'What is the primary role of a message broker?',
                  options: [
                    'Decouple communication between services',
                    'Directly serve HTML templates',
                    'Replace the relational database',
                    'Manage frontend CSS stylesheets',
                  ],
                  correctOptionIndex: 0,
                  explanation: 'Message brokers decouple producers and consumers asynchronously.',
                },
              ],
            },
          ],
        },
        {
          title: 'Section 2: Hands-on Implementation',
          position: 2,
          lessons: [
            {
              title: 'Building the First Service',
              type: LessonType.VIDEO,
              position: 1,
              estimatedDuration: 22,
              contentSummary: 'Live walkthrough building the service.',
            },
            {
              title: 'Testing and Verification Patterns',
              type: LessonType.TEXT,
              position: 2,
              estimatedDuration: 18,
              contentSummary: 'Writing unit and integration test suites.',
            },
          ],
        },
      ],
    };
  }
}
