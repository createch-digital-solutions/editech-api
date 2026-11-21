import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import type { Response } from 'express';
import { AiController } from '../../src/modules/ai/ai.controller.js';
import { AiService } from '../../src/modules/ai/ai.service.js';
import { AiProvider } from '../../src/modules/ai/ai.provider.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { TutorPersona } from '../../src/modules/ai/dto/tutor-chat.dto.js';
import type { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator.js';

describe('AiController', () => {
  let controller: AiController;

  const mockFindUnique = jest.fn<(...args: unknown[]) => Promise<unknown>>();
  const mockUpsert = jest.fn<(...args: unknown[]) => Promise<unknown>>();

  const mockPrismaService = {
    enrolment: { findUnique: jest.fn() },
    lesson: { findUnique: jest.fn() },
    aiConversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    aiUsage: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  };

  const mockAiProvider = {
    getModel: jest.fn().mockReturnValue(null),
    getModelName: jest.fn().mockReturnValue('gemini-2.5-flash'),
    hasValidKey: jest.fn().mockReturnValue(false),
  };

  const mockInstructor: AuthenticatedUser = {
    id: 'instructor-1',
    clerkId: 'clerk_inst_1',
    email: 'inst@test.com',
    firstName: 'Inst',
    lastName: 'User',
    role: Role.INSTRUCTOR,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };

  const mockLearner: AuthenticatedUser = {
    id: 'learner-1',
    clerkId: 'clerk_learner_1',
    email: 'learner@test.com',
    firstName: 'Learner',
    lastName: 'User',
    role: Role.LEARNER,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiProvider, useValue: mockAiProvider },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      module: 'ai',
      provider: 'google-gemini',
      model: 'gemini-2.5-flash',
      configured: false,
    });
  });

  it('should return structured course scaffold in fallback mode when model is unconfigured', async () => {
    const result = await controller.generateCourseScaffold({
      prompt: 'Build microservices with NestJS and Kafka',
    });

    expect(result).toBeDefined();
    expect(result.title).toContain('NestJS');
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sections[0]?.lessons.length).toBeGreaterThan(0);
  });

  it('should return today usage and remaining quota for an instructor', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'usage-1',
      userId: 'instructor-1',
      date: new Date(),
      exchanges: 4,
      tokensUsed: 25000,
    });

    const usage = await controller.getTodayUsage(mockInstructor);

    expect(usage).toBeDefined();
    expect(usage.exchanges).toBe(4);
    expect(usage.tokensUsed).toBe(25000);
    expect(usage.limits.maxExchanges).toBe(15);
    expect(usage.remaining.exchanges).toBe(11);
    expect(usage.remaining.tokens).toBe(75000);
  });

  it('should throw 429 AI_RATE_LIMIT_EXCEEDED when instructor daily quota is depleted', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'usage-1',
      userId: 'instructor-1',
      date: new Date(),
      exchanges: 15,
      tokensUsed: 50000,
    });

    await expect(
      controller.generateCourseScaffold(
        { prompt: 'Fullstack NextJS' },
        mockInstructor,
      ),
    ).rejects.toThrow(HttpException);

    try {
      await controller.generateCourseScaffold(
        { prompt: 'Fullstack NextJS' },
        mockInstructor,
      );
    } catch (err: unknown) {
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const res = httpErr.getResponse() as Record<string, unknown>;
      expect(res['code']).toBe('AI_RATE_LIMIT_EXCEEDED');
    }
  });

  it('should throw 429 DAILY_LIMIT_REACHED when learner daily exchanges are depleted', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'usage-2',
      userId: 'learner-1',
      date: new Date(),
      exchanges: 20,
      tokensUsed: 10000,
    });

    const mockRes = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    await expect(
      controller.streamTutorChat(
        mockLearner,
        {
          messages: [{ role: 'user', content: 'Explain props' }],
          persona: TutorPersona.FRIENDLY,
        },
        mockRes,
      ),
    ).rejects.toThrow(HttpException);

    try {
      await controller.streamTutorChat(
        mockLearner,
        {
          messages: [{ role: 'user', content: 'Explain props' }],
          persona: TutorPersona.FRIENDLY,
        },
        mockRes,
      );
    } catch (err: unknown) {
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const res = httpErr.getResponse() as Record<string, unknown>;
      expect(res['code']).toBe('DAILY_LIMIT_REACHED');
    }
  });

  it('should record usage and increment tokens upon successful generation', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({
      id: 'usage-3',
      userId: 'instructor-1',
      date: new Date(),
      exchanges: 1,
      tokensUsed: 500,
    });

    await controller.generateCourseScaffold(
      { prompt: 'GraphQL in NestJS' },
      mockInstructor,
    );

    expect(mockUpsert).toHaveBeenCalled();
    const calls = mockUpsert.mock.calls;
    const upsertArg = calls[0]?.[0] as {
      where: { userId_date: { userId: string } };
      update: {
        exchanges: { increment: number };
        tokensUsed: { increment: number };
      };
    };
    expect(upsertArg.where.userId_date.userId).toBe('instructor-1');
    expect(upsertArg.update).toEqual({
      exchanges: { increment: 1 },
      tokensUsed: { increment: 500 },
    });
  });
});
