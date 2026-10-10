/* eslint-disable @typescript-eslint/unbound-method */
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, SkillLevel, UserStatus } from '@prisma/client';
import { OnboardingController } from '../../src/modules/onboarding/onboarding.controller.js';
import { OnboardingService } from '../../src/modules/onboarding/onboarding.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import type { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator.js';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let onboardingService: OnboardingService;

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    clerkId: 'c1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.LEARNER,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: {
            onboardLearner: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                onboardingComplete: true,
                redirectTo: '/dashboard',
              }),
            onboardInstructor: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                instructorStatus: 'PENDING',
                message: 'Instructor application submitted successfully',
                redirectTo: '/portal/pending-approval',
              }),
            getOnboardingStatus: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                role: Role.LEARNER,
                profileStatus: 'PENDING_ONBOARDING',
                onboardingComplete: false,
                redirectTo: '/onboarding',
              }),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
    onboardingService = module.get<OnboardingService>(OnboardingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should onboard learner successfully', async () => {
    const dto = {
      careerGoal: 'Become a Full-stack dev',
      skillLevel: SkillLevel.BEGINNER,
      interests: ['React', 'NestJS'],
    };

    const result = await controller.onboardLearner(mockUser, dto);

    expect(result).toEqual({
      onboardingComplete: true,
      redirectTo: '/dashboard',
    });
    expect(onboardingService.onboardLearner).toHaveBeenCalledWith(
      mockUser.id,
      dto,
    );
  });

  it('should return onboarding status for learner as PENDING_ONBOARDING', async () => {
    const result = await controller.getStatus(mockUser);

    expect(result).toEqual({
      role: Role.LEARNER,
      profileStatus: 'PENDING_ONBOARDING',
      onboardingComplete: false,
      redirectTo: '/onboarding',
    });
    expect(onboardingService.getOnboardingStatus).toHaveBeenCalledWith(
      mockUser.id,
    );
  });
});
