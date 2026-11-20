import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AiController } from '../../src/modules/ai/ai.controller.js';
import { AiService } from '../../src/modules/ai/ai.service.js';
import { AiProvider } from '../../src/modules/ai/ai.provider.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

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
      findUnique: jest.fn() as any,
      upsert: jest.fn() as any,
    },
  };

  const mockAiProvider = {
    getModel: jest.fn().mockReturnValue(null),
    getModelName: jest.fn().mockReturnValue('gemini-2.5-flash'),
    hasValidKey: jest.fn().mockReturnValue(false),
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
    service = module.get<AiService>(AiService);
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
    expect(result.sections[0].lessons.length).toBeGreaterThan(0);
  });

  it('should return today usage and remaining quota for an instructor', async () => {
    mockPrismaService.aiUsage.findUnique.mockResolvedValue({
      id: 'usage-1',
      userId: 'instructor-1',
      date: new Date(),
      exchanges: 4,
      tokensUsed: 25000,
    });

    const mockUser = {
      id: 'instructor-1',
      clerkId: 'clerk_inst_1',
      email: 'inst@test.com',
      role: Role.INSTRUCTOR,
    };

    const usage = await controller.getTodayUsage(mockUser as any);

    expect(usage).toBeDefined();
    expect(usage.exchanges).toBe(4);
    expect(usage.tokensUsed).toBe(25000);
    expect(usage.limits.maxExchanges).toBe(15);
    expect(usage.remaining.exchanges).toBe(11);
    expect(usage.remaining.tokens).toBe(75000);
  });

  it('should throw 429 AI_RATE_LIMIT_EXCEEDED when instructor daily quota is depleted', async () => {
    mockPrismaService.aiUsage.findUnique.mockResolvedValue({
      id: 'usage-1',
      userId: 'instructor-1',
      date: new Date(),
      exchanges: 15, // maxed out
      tokensUsed: 50000,
    });

    const mockUser = {
      id: 'instructor-1',
      clerkId: 'clerk_inst_1',
      email: 'inst@test.com',
      role: Role.INSTRUCTOR,
    };

    await expect(
      controller.generateCourseScaffold(
        { prompt: 'Fullstack NextJS' },
        mockUser as any,
      ),
    ).rejects.toThrow(HttpException);

    try {
      await controller.generateCourseScaffold(
        { prompt: 'Fullstack NextJS' },
        mockUser as any,
      );
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.getResponse()).toEqual(
        expect.objectContaining({
          code: 'AI_RATE_LIMIT_EXCEEDED',
        }),
      );
    }
  });

  it('should throw 429 DAILY_LIMIT_REACHED when learner daily exchanges are depleted', async () => {
    mockPrismaService.aiUsage.findUnique.mockResolvedValue({
      id: 'usage-2',
      userId: 'learner-1',
      date: new Date(),
      exchanges: 20, // maxed out
      tokensUsed: 10000,
    });

    const mockUser = {
      id: 'learner-1',
      clerkId: 'clerk_learner_1',
      email: 'learner@test.com',
      role: Role.LEARNER,
    };

    const mockRes = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    await expect(
      controller.streamTutorChat(
        mockUser as any,
        {
          messages: [{ role: 'user', content: 'Explain props' }],
          persona: 'friendly',
        },
        mockRes as any,
      ),
    ).rejects.toThrow(HttpException);

    try {
      await controller.streamTutorChat(
        mockUser as any,
        {
          messages: [{ role: 'user', content: 'Explain props' }],
          persona: 'friendly',
        },
        mockRes as any,
      );
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.getResponse()).toEqual(
        expect.objectContaining({
          code: 'DAILY_LIMIT_REACHED',
        }),
      );
    }
  });

  it('should record usage and increment tokens upon successful generation', async () => {
    mockPrismaService.aiUsage.findUnique.mockResolvedValue(null);
    mockPrismaService.aiUsage.upsert.mockResolvedValue({
      id: 'usage-3',
      userId: 'instructor-1',
      date: new Date(),
      exchanges: 1,
      tokensUsed: 500,
    });

    const mockUser = {
      id: 'instructor-1',
      clerkId: 'clerk_inst_1',
      email: 'inst@test.com',
      role: Role.INSTRUCTOR,
    };

    await controller.generateCourseScaffold(
      { prompt: 'GraphQL in NestJS' },
      mockUser as any,
    );

    expect(mockPrismaService.aiUsage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_date: expect.objectContaining({
            userId: 'instructor-1',
          }),
        }),
        update: {
          exchanges: { increment: 1 },
          tokensUsed: { increment: 500 },
        },
      }),
    );
  });
});
