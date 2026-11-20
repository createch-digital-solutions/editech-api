import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
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
import { Role, CourseLevel, OutcomeTag, LessonType } from '@prisma/client';
import {
  AI_QUOTA_LIMITS,
  AI_ERROR_CODES,
} from './ai.constants.js';
import { TodayUsageResponseDto } from './dto/today-usage.dto.js';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AiProvider,
  ) {}

  getHealth() {
    const configured = this.aiProvider.hasValidKey();
    const model = this.aiProvider.getModelName();
    this.logger.log(
      `[AI Health] Status: ok, model: ${model}, keyConfigured: ${configured}`,
    );
    return {
      status: 'ok',
      module: 'ai',
      provider: 'google-gemini',
      model,
      configured,
    };
  }

  /**
   * Returns normalized UTC midnight for current day
   */
  getUtcToday(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  /**
   * Retrieves today's AI usage and remaining quota for a user (Phase 15 #43)
   */
  async getTodayUsage(
    userId: string,
    role: Role = Role.LEARNER,
  ): Promise<TodayUsageResponseDto> {
    const today = this.getUtcToday();
    const usage = await this.prisma.aiUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    const limits = AI_QUOTA_LIMITS[role] || AI_QUOTA_LIMITS[Role.LEARNER];
    const exchanges = usage?.exchanges ?? 0;
    const tokensUsed = usage?.tokensUsed ?? 0;

    return {
      date: today,
      exchanges,
      tokensUsed,
      limits: {
        maxExchanges: limits.maxExchanges,
        maxTokens: limits.maxTokens,
      },
      remaining: {
        exchanges: Math.max(0, limits.maxExchanges - exchanges),
        tokens: Math.max(0, limits.maxTokens - tokensUsed),
      },
    };
  }

  /**
   * Pre-flight guardrail: validates that user has not exceeded daily quota.
   * Throws 429 Too Many Requests if quota is depleted.
   */
  async checkQuota(
    userId: string,
    role: Role = Role.LEARNER,
  ): Promise<TodayUsageResponseDto> {
    const usage = await this.getTodayUsage(userId, role);

    if (usage.remaining.exchanges <= 0 || usage.remaining.tokens <= 0) {
      const isInstructor = role === Role.INSTRUCTOR;
      const errorCode = isInstructor
        ? AI_ERROR_CODES.RATE_LIMIT_EXCEEDED
        : AI_ERROR_CODES.DAILY_LIMIT_REACHED;

      const errorMessage = isInstructor
        ? `Daily AI generation limit reached (${usage.limits.maxExchanges} generations or ${usage.limits.maxTokens} tokens per day). Please try again tomorrow.`
        : `Daily AI tutor question limit reached (${usage.limits.maxExchanges} questions per day). Please try again tomorrow.`;

      this.logger.warn(
        `[AI Quota Exceeded] Blocked request for userId=${userId}, role=${role}, exchanges=${usage.exchanges}/${usage.limits.maxExchanges}, tokens=${usage.tokensUsed}/${usage.limits.maxTokens}`,
      );

      throw new HttpException(
        {
          code: errorCode,
          message: errorMessage,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return usage;
  }

  /**
   * Post-flight recorder: atomic upsert to accumulate tokens & exchange count
   */
  async recordUsage(userId: string, tokens: number = 0) {
    const today = this.getUtcToday();
    const tokenIncrement = Math.max(0, tokens);

    try {
      return await this.prisma.aiUsage.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          exchanges: 1,
          tokensUsed: tokenIncrement,
        },
        update: {
          exchanges: { increment: 1 },
          tokensUsed: { increment: tokenIncrement },
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record AI usage for userId=${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Generates a complete, structured course outline with modules, lessons, and quizzes.
   */
  async generateCourseScaffold(
    dto: GenerateCourseDto,
    userId?: string,
    role: Role = Role.INSTRUCTOR,
  ): Promise<CourseScaffold> {
    if (userId) {
      await this.checkQuota(userId, role);
    }

    const model = this.aiProvider.getModel();
    const modelName = this.aiProvider.getModelName();

    this.logger.log(
      `[AI Course Scaffold Request] prompt="${dto.prompt.slice(0, 80)}...", level=${dto.level || 'INTERMEDIATE'}, outcome=${dto.outcomeTag || 'GET_A_JOB'}, category=${dto.category || 'default'}`,
    );

    if (!model) {
      this.logger.warn(
        `AI Provider not configured with valid API key. Returning deterministic scaffold stub for development.`,
      );
      if (userId) {
        await this.recordUsage(userId, 500);
      }
      return this.generateStubScaffold(dto);
    }

    const systemPrompt = COURSE_BUILDER_SYSTEM_PROMPT;
    const userPrompt = buildCourseScaffoldUserPrompt({
      prompt: dto.prompt,
      level: dto.level,
      outcomeTag: dto.outcomeTag,
      category: dto.category,
    });

    try {
      this.logger.log(
        `[AI Course Scaffold] Calling Gemini (${modelName}) with structured Zod schema...`,
      );
      const { object, usage } = await generateObject({
        model,
        schema: CourseScaffoldSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      this.logger.log(
        `[AI Course Scaffold Complete] Generated course "${object.title}" with ${object.sections.length} sections and ${object.tags.length} tags.`,
      );

      if (userId) {
        const totalTokens =
          usage?.totalTokens ?? Math.ceil(JSON.stringify(object).length / 4);
        await this.recordUsage(userId, totalTokens);
      }

      return object;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown generation error';
      this.logger.error(
        `[AI Course Scaffold Error] Failed to generate course scaffold from model (${modelName}): ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
      );
      this.logger.warn('Falling back to deterministic scaffold stub.');
      if (userId) {
        await this.recordUsage(userId, 500);
      }
      return this.generateStubScaffold(dto);
    }
  }

  /**
   * Streams conversational response with Aria (The AI Learning Coach)
   * Enforces Dual-Scope Paywall & Enrollment Security
   */
  async streamTutorChat(
    learnerId: string,
    dto: TutorChatDto,
    res: Response,
    role: Role = Role.LEARNER,
  ): Promise<void> {
    // 0. Pre-flight quota check: ensures learner has remaining exchanges today
    await this.checkQuota(learnerId, role);

    const model = this.aiProvider.getModel();
    const modelName = this.aiProvider.getModelName();
    const latestMsg = dto.messages[dto.messages.length - 1];

    this.logger.log(
      `[Aria Chat Request] learnerId=${learnerId}, persona=${dto.persona}, msgCount=${dto.messages.length}, courseId=${dto.courseId || 'none'}, lessonId=${dto.lessonId || 'none'}, latestQuery="${latestMsg?.content?.slice(0, 70) || ''}..."`,
    );

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
        this.logger.warn(
          `[Aria Security] Access denied: learnerId=${learnerId} is not actively enrolled in courseId=${dto.courseId}`,
        );
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
      this.logger.warn(
        `[Aria Stream Fallback] AI model not configured for streaming. Returning stub message.`,
      );
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      const fallbackReply =
        `Hello! I'm Aria, your learning coach. (AI Provider is currently in demo/stub mode: set GEMINI_API_KEY on Render to activate live AI). ` +
        `Regarding your question, keep practicing and review the course material!`;
      res.write(fallbackReply);
      res.end();
      await this.recordUsage(learnerId, 100);
      return;
    }

    // 4. Stream response using Vercel AI SDK with robust error capturing
    try {
      this.logger.log(
        `[Aria Stream Start] Initiating stream with ${modelName}...`,
      );
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
      let chunkCount = 0;
      for await (const chunk of result.textStream) {
        chunkCount++;
        fullReply += chunk;
        res.write(chunk);
      }
      res.end();

      this.logger.log(
        `[Aria Stream Complete] Delivered ${chunkCount} chunks (~${fullReply.length} chars) to learnerId=${learnerId}`,
      );

      // 5. Asynchronously persist conversation history and record usage
      const estimatedTokens = Math.ceil((fullReply.length + 100) / 4);
      await this.recordUsage(learnerId, estimatedTokens);

      if (fullReply.trim()) {
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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown AI streaming error';
      this.logger.error(
        `[Aria Stream Error] Failed during streamText execution with model (${modelName}): ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
      );

      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      res.write(
        `I encountered a temporary problem contacting the AI service (${errorMessage}). Please try again in a moment.`,
      );
      res.end();
    }
  }

  /**
   * Retrieves chat history for a learner
   */
  async getConversations(learnerId: string, lessonId?: string) {
    this.logger.log(
      `[Aria History] Fetching conversations for learnerId=${learnerId}, lessonId=${lessonId || 'all'}`,
    );
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
    const updatedMessages = [...history, { role: 'assistant', content: reply }];

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
              contentSummary:
                'Overview of system architecture and prerequisites.',
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
                  explanation:
                    'Message brokers decouple producers and consumers asynchronously.',
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
