/* eslint-disable @typescript-eslint/unbound-method */
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { CoursesController } from '../../src/modules/courses/courses.controller.js';
import { CategoriesController } from '../../src/modules/courses/categories.controller.js';
import { CoursesService } from '../../src/modules/courses/courses.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import type { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  let categoriesController: CategoriesController;
  let service: CoursesService;

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

  const mockCourseListItem = {
    id: 'course-1',
    title: 'Product Management Fundamentals',
    slug: 'product-management-fundamentals',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    instructor: {
      id: 'inst-1',
      name: 'Tunde Adebayo',
      avatarUrl: null,
    },
    price: 8000,
    isFree: false,
    level: 'BEGINNER',
    category: 'PRODUCT_MANAGEMENT',
    outcomeTag: 'GET_A_JOB',
    averageRating: 4.7,
    reviewCount: 23,
    enrolmentCount: 312,
    totalLessons: 24,
    totalDuration: 480,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController, CategoriesController],
      providers: [
        {
          provide: CoursesService,
          useValue: {
            getHealth: jest
              .fn()
              .mockReturnValue({ status: 'ok', module: 'courses' }),
            listCourses: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                data: [mockCourseListItem],
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
              }),
            searchCourses: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                data: {
                  hits: [mockCourseListItem],
                  query: 'product',
                  processingTimeMs: 10,
                },
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
              }),
            getFeaturedCourses: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue([mockCourseListItem]),
            getCategories: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue([
                { name: 'PRODUCT_MANAGEMENT', courseCount: 5 },
              ]),
            getCourseBySlug: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                ...mockCourseListItem,
                description: 'Detailed description',
                curriculum: [],
                learnerEnrolment: null,
              }),
            getCoursePreview: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                courseId: 'course-1',
                title: 'Product Management',
                previewSections: [],
              }),
            getCourseReviews: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
              }),
            createReview: jest
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue({
                id: 'review-1',
                rating: 5,
                reviewText: 'Great course!',
                createdAt: new Date(),
              }),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    categoriesController =
      module.get<CategoriesController>(CategoriesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(categoriesController).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'courses' });
  });

  it('should list published courses with pagination', async () => {
    const result = await controller.listCourses({ page: 1, limit: 20 });
    expect(result).toHaveProperty('data');
    expect(service.listCourses).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('should search courses with term q', async () => {
    const result = await controller.searchCourses({ q: 'product' });
    expect(result).toHaveProperty('data');
    expect(service.searchCourses).toHaveBeenCalledWith({ q: 'product' });
  });

  it('should get course by slug', async () => {
    const result = await controller.getCourseBySlug(
      'product-management-fundamentals',
      mockUser,
    );
    expect(result).toHaveProperty('slug', 'product-management-fundamentals');
    expect(service.getCourseBySlug).toHaveBeenCalledWith(
      'product-management-fundamentals',
      mockUser.id,
    );
  });

  it('should submit a course review', async () => {
    const result = await controller.createReview('course-1', mockUser, {
      rating: 5,
      reviewText: 'Great course!',
    });
    expect(result).toHaveProperty('id', 'review-1');
    expect(service.createReview).toHaveBeenCalledWith('course-1', mockUser.id, {
      rating: 5,
      reviewText: 'Great course!',
    });
  });

  it('should return categories via CategoriesController', async () => {
    const result = await categoriesController.getCategories();
    expect(result).toEqual([{ name: 'PRODUCT_MANAGEMENT', courseCount: 5 }]);
    expect(service.getCategories).toHaveBeenCalled();
  });
});
