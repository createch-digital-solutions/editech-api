import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from '../../src/modules/ai/ai.controller.js';
import { AiService } from '../../src/modules/ai/ai.service.js';
import { AiProvider } from '../../src/modules/ai/ai.provider.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('AiController', () => {
  let controller: AiController;

  const mockPrismaService = {
    enrolment: { findUnique: jest.fn() },
    lesson: { findUnique: jest.fn() },
    aiConversation: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };

  const mockAiProvider = {
    getModel: jest.fn().mockReturnValue(null),
    getModelName: jest.fn().mockReturnValue('gemini-2.5-flash'),
    hasValidKey: jest.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
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
    expect(result.sections[0].lessons.length).toBeGreaterThan(0);
  });
});
