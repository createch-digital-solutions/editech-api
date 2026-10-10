import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, SkillLevel, UserStatus } from '@prisma/client';
import { OnboardingController } from '../../src/modules/onboarding/onboarding.controller.js';
import { OnboardingService } from '../../src/modules/onboarding/onboarding.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('OnboardingController', () => {
  let controller: OnboardingController;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    learnerProfile: {
      upsert: jest.fn(),
    },
    instructorProfile: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should onboard learner successfully', async () => {
    (mockPrisma.user.findUnique as any).mockResolvedValue({ id: 'user-1' });
    (mockPrisma.learnerProfile.upsert as any).mockResolvedValue({});

    const result = await controller.onboardLearner(
      {
        id: 'user-1',
        clerkId: 'c1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.LEARNER,
        status: UserStatus.ACTIVE,
      },
      {
        careerGoal: 'Become a Full-stack dev',
        skillLevel: SkillLevel.BEGINNER,
        interests: ['React', 'NestJS'],
      },
    );

    expect(result).toEqual({
      onboardingComplete: true,
      redirectTo: '/dashboard',
    });
  });

  it('should return onboarding status for learner with no profile as PENDING_ONBOARDING', async () => {
    (mockPrisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
      learnerProfile: null,
    });

    const result = await controller.getStatus({
      id: 'user-1',
      clerkId: 'c1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
    });

    expect(result).toEqual({
      role: Role.LEARNER,
      profileStatus: 'PENDING_ONBOARDING',
      onboardingComplete: false,
      redirectTo: '/onboarding',
    });
  });
});
