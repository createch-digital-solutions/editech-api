import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, EnrolmentStatus } from '@prisma/client';
import { LearnerController } from '../../src/modules/learner/learner.controller.js';
import { LearnerService } from '../../src/modules/learner/learner.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('LearnerController', () => {
  let controller: LearnerController;
  let service: LearnerService;

  const mockUser = {
    id: 'user-uuid-123',
    clerkId: 'user_clerk_123',
    email: 'learner@editech.com',
    firstName: 'Tunde',
    lastName: 'Ade',
    role: Role.LEARNER,
    status: 'ACTIVE' as any,
  };

  const mockEnrolmentResponse = {
    message: 'Enrolled successfully',
    enrolment: {
      id: 'enrolment-uuid-1',
      courseId: 'course-uuid-1',
      status: EnrolmentStatus.ACTIVE,
      progress: 0,
      progressPercentage: 0,
      enrolledAt: new Date(),
      completedAt: null,
      course: {
        id: 'course-uuid-1',
        title: 'UI/UX Design Systems',
        slug: 'ui-ux-design-systems',
        thumbnailUrl: '/learner/course-uiux.jpg',
        totalLessons: 10,
        totalDuration: 5200,
      },
    },
  };

  const mockLearnerService = {
    getHealth: jest.fn(() => ({ status: 'ok', module: 'learner' })),
    getEnrolments: jest.fn(async () => [
      {
        id: 'enrolment-uuid-1',
        courseId: 'course-uuid-1',
        status: EnrolmentStatus.ACTIVE,
        progress: 0,
        progressPercentage: 0,
        enrolledAt: new Date(),
        completedAt: null,
        course: {
          id: 'course-uuid-1',
          title: 'UI/UX Design Systems',
          slug: 'ui-ux-design-systems',
          description: 'Figma design systems',
          thumbnailUrl: '/learner/course-uiux.jpg',
          category: 'UI/UX Design',
          level: 'BEGINNER',
          totalLessons: 10,
          totalDuration: 5200,
          averageRating: 4.8,
          reviewCount: 40,
          instructorName: 'Chidi Eze',
          instructorAvatar: null,
        },
      },
    ]),
    getEnrolmentByCourse: jest.fn(async () => mockEnrolmentResponse.enrolment),
    enrollInCourse: jest.fn(async () => mockEnrolmentResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearnerController],
      providers: [
        {
          provide: LearnerService,
          useValue: mockLearnerService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LearnerController>(LearnerController);
    service = module.get<LearnerService>(LearnerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'learner' });
  });

  it('should get all enrolments for authenticated learner', async () => {
    const result = await controller.getEnrolments(mockUser);
    expect(service.getEnrolments).toHaveBeenCalledWith(mockUser.id);
    expect(result).toHaveLength(1);
    expect(result[0].course.slug).toBe('ui-ux-design-systems');
  });

  it('should get single course enrolment status', async () => {
    const result = await controller.getEnrolmentByCourse('ui-ux-design-systems', mockUser);
    expect(service.getEnrolmentByCourse).toHaveBeenCalledWith(mockUser.id, 'ui-ux-design-systems');
    expect(result?.courseId).toBe('course-uuid-1');
  });

  it('should enroll in course via URL parameter', async () => {
    const result = await controller.enrollInCourseByParam('ui-ux-design-systems', mockUser);
    expect(service.enrollInCourse).toHaveBeenCalledWith(
      mockUser.id,
      'ui-ux-design-systems',
      mockUser.role,
    );
    expect(result.message).toBe('Enrolled successfully');
  });

  it('should enroll in course via body payload', async () => {
    const result = await controller.enrollInCourseByBody(
      { courseId: 'ui-ux-design-systems' },
      mockUser,
    );
    expect(service.enrollInCourse).toHaveBeenCalledWith(
      mockUser.id,
      'ui-ux-design-systems',
      mockUser.role,
    );
    expect(result.message).toBe('Enrolled successfully');
  });
});
