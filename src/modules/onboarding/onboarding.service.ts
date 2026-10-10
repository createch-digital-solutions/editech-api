import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role, UserStatus, InstructorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LearnerOnboardingDto } from './dto/learner-onboarding.dto.js';
import { InstructorOnboardingDto } from './dto/instructor-onboarding.dto.js';

export type ProfileStatus =
  'PENDING_ONBOARDING' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit and persist learner onboarding selections (career goals, skill level, topics).
   */
  async onboardLearner(userId: string, dto: LearnerOnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Learner user record not found',
      });
    }

    await this.prisma.learnerProfile.upsert({
      where: { userId },
      create: {
        userId,
        careerGoal: dto.careerGoal,
        skillLevel: dto.skillLevel,
        interests: dto.interests ?? [],
        totalXp: 0,
        currentLevel: 1,
        streakDays: 0,
      },
      update: {
        careerGoal: dto.careerGoal,
        skillLevel: dto.skillLevel,
        interests: dto.interests ?? [],
      },
    });

    this.logger.log(
      `Learner profile successfully onboarded for user ${userId}`,
    );

    return {
      onboardingComplete: true,
      redirectTo: '/dashboard',
    };
  }

  /**
   * Submit instructor onboarding application (bio, expertise, optional payout details).
   */
  async onboardInstructor(userId: string, dto: InstructorOnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Instructor user record not found',
      });
    }

    await this.prisma.instructorProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: dto.bio,
        expertise: dto.expertise ?? [],
        status: InstructorStatus.PENDING,
      },
      update: {
        bio: dto.bio,
        expertise: dto.expertise ?? [],
      },
    });

    this.logger.log(
      `Instructor onboarding application submitted for user ${userId}`,
    );

    return {
      instructorStatus: InstructorStatus.PENDING,
      message:
        'Instructor application submitted successfully and is pending administrative review.',
      redirectTo: '/portal/pending-approval',
    };
  }

  /**
   * Calculate derived profileStatus and recommended redirect route.
   */
  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        learnerProfile: true,
        instructorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
      });
    }

    let profileStatus: ProfileStatus;

    if (user.status === UserStatus.SUSPENDED) {
      profileStatus = 'SUSPENDED';
    } else if (user.role === Role.ADMIN) {
      profileStatus = 'ACTIVE';
    } else if (user.role === Role.INSTRUCTOR) {
      const inst = user.instructorProfile;
      if (!inst || !inst.bio) {
        profileStatus = 'PENDING_ONBOARDING';
      } else if (inst.status === InstructorStatus.APPROVED) {
        profileStatus = 'ACTIVE';
      } else if (inst.status === InstructorStatus.SUSPENDED) {
        profileStatus = 'SUSPENDED';
      } else {
        profileStatus = 'PENDING_APPROVAL';
      }
    } else {
      // Default / LEARNER
      const learner = user.learnerProfile;
      if (!learner || !learner.careerGoal) {
        profileStatus = 'PENDING_ONBOARDING';
      } else {
        profileStatus = 'ACTIVE';
      }
    }

    let redirectTo = '/dashboard';
    if (user.role === Role.ADMIN) {
      redirectTo = '/admin';
    } else if (user.role === Role.INSTRUCTOR) {
      if (profileStatus === 'PENDING_ONBOARDING') {
        redirectTo = '/portal/onboarding';
      } else if (profileStatus === 'PENDING_APPROVAL') {
        redirectTo = '/portal/pending-approval';
      } else if (profileStatus === 'ACTIVE') {
        redirectTo = '/portal';
      } else {
        redirectTo = '/unauthorized';
      }
    } else {
      if (profileStatus === 'PENDING_ONBOARDING') {
        redirectTo = '/onboarding';
      } else {
        redirectTo = '/dashboard';
      }
    }

    return {
      role: user.role,
      profileStatus,
      onboardingComplete: profileStatus === 'ACTIVE',
      redirectTo,
    };
  }
}
