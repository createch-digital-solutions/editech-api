import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  CourseStatus,
  InstructorStatus,
  EnrolmentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CourseQueryDto } from './dto/course-query.dto.js';
import { CourseSearchDto } from './dto/course-search.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'courses' };
  }

  /**
   * Helper to format a course for marketplace listings (Section 4.1)
   */
  private formatCourseListItem(
    course: Prisma.CourseGetPayload<{
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true;
                lastName: true;
                avatarUrl: true;
              };
            };
          };
        };
      };
    }>,
  ) {
    const instructorName =
      `${course.instructor.user.firstName} ${course.instructor.user.lastName}`.trim() ||
      'Instructor';

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
      instructor: {
        id: course.instructor.id,
        name: instructorName,
        avatarUrl: course.instructor.user.avatarUrl,
      },
      price: Number(course.price),
      isFree: course.isFree,
      level: course.level,
      category: course.category,
      outcomeTag: course.outcomeTag,
      averageRating: Number(course.averageRating),
      reviewCount: course.reviewCount,
      enrolmentCount: course.enrolmentCount,
      totalLessons: course.totalLessons,
      totalDuration: course.totalDuration,
    };
  }

  /**
   * 4.1 GET /api/v1/courses - List published courses with filters and pagination
   */
  async listCourses(query: CourseQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      deletedAt: null,
      ...(query.category
        ? { category: { equals: query.category, mode: 'insensitive' } }
        : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.outcomeTag ? { outcomeTag: query.outcomeTag } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.minRating !== undefined
        ? { averageRating: { gte: query.minRating } }
        : {}),
    };

    let orderBy: Prisma.CourseOrderByWithRelationInput = {
      createdAt: query.order || 'desc',
    };

    if (query.sort === 'enrolment_count') {
      orderBy = { enrolmentCount: query.order || 'desc' };
    } else if (query.sort === 'price') {
      orderBy = { price: query.order || 'asc' };
    } else if (query.sort === 'rating') {
      orderBy = { averageRating: query.order || 'desc' };
    } else if (query.sort === 'created_at') {
      orderBy = { createdAt: query.order || 'desc' };
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          instructor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses.map((c) => this.formatCourseListItem(c)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4.2 GET /api/v1/courses/search - Full-text course search
   */
  async searchCourses(query: CourseSearchDto) {
    if (!query.q || !query.q.trim()) {
      throw new BadRequestException({
        code: 'MISSING_QUERY',
        message: 'Search query parameter q is required',
      });
    }

    const start = Date.now();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const term = query.q.trim();

    const where: Prisma.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      deletedAt: null,
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
      ],
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        orderBy: { enrolmentCount: 'desc' },
        skip,
        take: limit,
        include: {
          instructor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const processingTimeMs = Date.now() - start;

    return {
      data: {
        hits: courses.map((c) => this.formatCourseListItem(c)),
        query: term,
        processingTimeMs,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4.x GET /api/v1/courses/featured - Featured published courses
   */
  async getFeaturedCourses() {
    let courses = await this.prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
        isFeatured: true,
      },
      take: 6,
      orderBy: { enrolmentCount: 'desc' },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Fallback to top enrolled courses if none flagged as featured
    if (courses.length === 0) {
      courses = await this.prisma.course.findMany({
        where: {
          status: CourseStatus.PUBLISHED,
          deletedAt: null,
        },
        take: 6,
        orderBy: { enrolmentCount: 'desc' },
        include: {
          instructor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    }

    return courses.map((c) => this.formatCourseListItem(c));
  }

  /**
   * 4.x GET /api/v1/categories - Distinct course categories with counts
   */
  async getCategories() {
    const groups = await this.prisma.course.groupBy({
      by: ['category'],
      where: {
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
        category: { not: null },
      },
      _count: { id: true },
    });

    return groups.map((g) => ({
      name: g.category as string,
      courseCount: g._count.id,
    }));
  }

  /**
   * 4.3 GET /api/v1/courses/:slug - Full course detail with curriculum and enrolment status
   */
  async getCourseBySlug(slug: string, currentUserId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        sections: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (
      !course ||
      course.deletedAt !== null ||
      course.status !== CourseStatus.PUBLISHED
    ) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: `Course with slug '${slug}' not found`,
      });
    }

    let learnerEnrolment: {
      id: string;
      status: EnrolmentStatus;
      progress: number;
      enrolledAt: Date;
    } | null = null;

    if (currentUserId) {
      const enrolment = await this.prisma.enrolment.findUnique({
        where: {
          learnerId_courseId: {
            learnerId: currentUserId,
            courseId: course.id,
          },
        },
      });

      if (enrolment) {
        learnerEnrolment = {
          id: enrolment.id,
          status: enrolment.status,
          progress: Number(enrolment.progress),
          enrolledAt: enrolment.enrolledAt,
        };
      }
    }

    const curriculum = course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      position: section.position,
      lessons: section.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        position: lesson.position,
        type: lesson.type,
        duration: lesson.videoDuration || 0,
        isPreview: lesson.isPreview,
        isLocked: !lesson.isPreview && !learnerEnrolment,
      })),
    }));

    const instructorName =
      `${course.instructor.user.firstName} ${course.instructor.user.lastName}`.trim() ||
      'Instructor';

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      level: course.level,
      category: course.category,
      outcomeTag: course.outcomeTag,
      price: Number(course.price),
      isFree: course.isFree,
      averageRating: Number(course.averageRating),
      reviewCount: course.reviewCount,
      enrolmentCount: course.enrolmentCount,
      totalLessons: course.totalLessons,
      totalDuration: course.totalDuration,
      instructor: {
        id: course.instructor.id,
        name: instructorName,
        bio: course.instructor.bio,
        avatarUrl: course.instructor.user.avatarUrl,
        totalStudents: course.instructor.totalStudents,
        averageRating: Number(course.instructor.averageRating),
      },
      curriculum,
      learnerEnrolment,
    };
  }

  /**
   * 4.x GET /api/v1/courses/:slug/preview - Preview lessons
   */
  async getCoursePreview(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              where: {
                isPreview: true,
                isPublished: true,
                deletedAt: null,
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (
      !course ||
      course.deletedAt !== null ||
      course.status !== CourseStatus.PUBLISHED
    ) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: `Course with slug '${slug}' not found`,
      });
    }

    return {
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      previewSections: course.sections.map((s) => ({
        id: s.id,
        title: s.title,
        lessons: s.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          videoUrl: l.videoUrl,
          duration: l.videoDuration || 0,
        })),
      })),
    };
  }

  /**
   * 4.x GET /api/v1/courses/:id/reviews - List reviews for a course
   */
  async getCourseReviews(courseId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.courseReview.findMany({
        where: { courseId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          learner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.courseReview.count({
        where: { courseId, deletedAt: null },
      }),
    ]);

    return {
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        reviewText: r.reviewText,
        createdAt: r.createdAt,
        learner: {
          id: r.learner.id,
          name:
            `${r.learner.firstName} ${r.learner.lastName}`.trim() || 'Learner',
          avatarUrl: r.learner.avatarUrl,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4.4 POST /api/v1/courses/:id/reviews - Submit review (learner must have completed course)
   */
  async createReview(
    courseId: string,
    learnerUserId: string,
    dto: CreateReviewDto,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.deletedAt !== null) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException({
        code: 'INVALID_RATING',
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    // Must be enrolled and completed
    const enrolment = await this.prisma.enrolment.findUnique({
      where: {
        learnerId_courseId: {
          learnerId: learnerUserId,
          courseId,
        },
      },
    });

    if (
      !enrolment ||
      (enrolment.status !== EnrolmentStatus.COMPLETED &&
        Number(enrolment.progress) < 100)
    ) {
      throw new ForbiddenException({
        code: 'COURSE_NOT_COMPLETED',
        message: 'You must complete the course before submitting a review.',
      });
    }

    // Duplicate check
    const existing = await this.prisma.courseReview.findUnique({
      where: {
        courseId_learnerId: {
          courseId,
          learnerId: learnerUserId,
        },
      },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException({
        code: 'REVIEW_ALREADY_EXISTS',
        message: 'You have already submitted a review for this course.',
      });
    }

    const review = await this.prisma.courseReview.create({
      data: {
        courseId,
        learnerId: learnerUserId,
        rating: dto.rating,
        reviewText: dto.reviewText,
      },
    });

    // Recalculate average rating & review count
    const aggregates = await this.prisma.courseReview.aggregate({
      where: { courseId, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: aggregates._avg.rating || 0,
        reviewCount: aggregates._count.rating || 0,
      },
    });

    return {
      id: review.id,
      rating: review.rating,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
    };
  }

  // ==========================================
  // INSTRUCTOR COURSE AUTHORING (EPIC-05)
  // ==========================================

  /**
   * Helper to resolve instructor profile
   */
  private async getInstructorProfileOrThrow(userId: string) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ForbiddenException({
        code: 'INSTRUCTOR_NOT_APPROVED',
        message: 'Instructor profile not found for this user',
      });
    }

    if (profile.status !== InstructorStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'INSTRUCTOR_NOT_APPROVED',
        message:
          'Your instructor profile is not approved yet. Only approved instructors can author courses.',
      });
    }

    return profile;
  }

  /**
   * 6.1 POST /api/v1/instructor/courses - Create course (draft)
   */
  async createCourse(userId: string, dto: CreateCourseDto) {
    const instructor = await this.getInstructorProfileOrThrow(userId);

    // Business rule: price must be at least NGN 1,000 if not free
    if (dto.price !== undefined && dto.price > 0 && dto.price < 1000) {
      throw new UnprocessableEntityException({
        code: 'PRICE_BELOW_MINIMUM',
        message:
          'Course price must be at least NGN 1,000 or set to 0 for free courses.',
      });
    }

    const baseSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${randomSuffix}`;

    const course = await this.prisma.course.create({
      data: {
        instructorId: instructor.id,
        title: dto.title,
        slug,
        description: dto.description,
        level: dto.level,
        category: dto.category,
        outcomeTag: dto.outcomeTag,
        price: dto.price ?? 0,
        isFree: dto.price === 0 || dto.price === undefined,
        thumbnailUrl: dto.thumbnailUrl,
        tags: dto.tags ?? [],
        status: CourseStatus.DRAFT,
      },
    });

    return {
      id: course.id,
      slug: course.slug,
      status: course.status,
    };
  }

  /**
   * 6.x PATCH /api/v1/instructor/courses/:id - Update course metadata
   */
  async updateCourse(courseId: string, userId: string, dto: UpdateCourseDto) {
    const instructor = await this.getInstructorProfileOrThrow(userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.deletedAt !== null) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    if (course.instructorId !== instructor.id) {
      throw new ForbiddenException({
        code: 'NOT_COURSE_OWNER',
        message: 'You are not the owner of this course',
      });
    }

    if (dto.price !== undefined && dto.price > 0 && dto.price < 1000) {
      throw new UnprocessableEntityException({
        code: 'PRICE_BELOW_MINIMUM',
        message: 'Course price must be at least NGN 1,000',
      });
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.outcomeTag !== undefined ? { outcomeTag: dto.outcomeTag } : {}),
        ...(dto.price !== undefined
          ? {
              price: dto.price,
              isFree: dto.price === 0,
            }
          : {}),
        ...(dto.thumbnailUrl !== undefined
          ? { thumbnailUrl: dto.thumbnailUrl }
          : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
    };
  }

  /**
   * 6.2 POST /api/v1/instructor/courses/:id/submit - Submit course for admin review
   */
  async submitCourseForReview(courseId: string, userId: string) {
    const instructor = await this.getInstructorProfileOrThrow(userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { deletedAt: null },
        },
      },
    });

    if (!course || course.deletedAt !== null) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    if (course.instructorId !== instructor.id) {
      throw new ForbiddenException({
        code: 'NOT_COURSE_OWNER',
        message: 'You are not the owner of this course',
      });
    }

    if (!course.thumbnailUrl) {
      throw new UnprocessableEntityException({
        code: 'COURSE_MISSING_THUMBNAIL',
        message: 'Course must have a thumbnail before submitting for review.',
      });
    }

    if (course.lessons.length === 0) {
      throw new UnprocessableEntityException({
        code: 'COURSE_HAS_NO_LESSONS',
        message: 'Course must contain at least one lesson before submitting.',
      });
    }

    if (course.status === CourseStatus.PENDING) {
      throw new UnprocessableEntityException({
        code: 'COURSE_ALREADY_SUBMITTED',
        message: 'Course has already been submitted for review.',
      });
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PENDING },
    });

    return {
      courseId: updated.id,
      status: updated.status,
      message:
        'Your course has been submitted. Expect a decision within 48 hours.',
    };
  }

  /**
   * 6.x POST /api/v1/instructor/courses/:id/sections - Create course section
   */
  async addSection(courseId: string, userId: string, dto: CreateSectionDto) {
    const instructor = await this.getInstructorProfileOrThrow(userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { sections: true },
    });

    if (!course || course.deletedAt !== null) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    if (course.instructorId !== instructor.id) {
      throw new ForbiddenException({
        code: 'NOT_COURSE_OWNER',
        message: 'You are not the owner of this course',
      });
    }

    const position = dto.position ?? course.sections.length + 1;

    const section = await this.prisma.courseSection.create({
      data: {
        courseId,
        title: dto.title,
        position,
      },
    });

    return section;
  }

  /**
   * 6.x POST /api/v1/instructor/sections/:id/lessons - Create lesson in section
   */
  async addLesson(sectionId: string, userId: string, dto: CreateLessonDto) {
    const instructor = await this.getInstructorProfileOrThrow(userId);

    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        lessons: true,
      },
    });

    if (!section || section.course.deletedAt !== null) {
      throw new NotFoundException({
        code: 'SECTION_NOT_FOUND',
        message: 'Section not found',
      });
    }

    if (section.course.instructorId !== instructor.id) {
      throw new ForbiddenException({
        code: 'NOT_COURSE_OWNER',
        message: 'You are not the owner of this course',
      });
    }

    const position = dto.position ?? section.lessons.length + 1;

    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId,
        courseId: section.courseId,
        title: dto.title,
        position,
        type: dto.type,
        videoUrl: dto.videoUrl,
        videoDuration: dto.videoDuration ?? 0,
        content: dto.content,
        isPreview: dto.isPreview ?? false,
      },
    });

    // Update aggregate totals on course
    await this.prisma.course.update({
      where: { id: section.courseId },
      data: {
        totalLessons: { increment: 1 },
        totalDuration: { increment: dto.videoDuration ?? 0 },
      },
    });

    return lesson;
  }

  /**
   * 6.x DELETE /api/v1/instructor/courses/:id - Soft-delete course
   */
  async deleteCourse(courseId: string, userId: string) {
    const instructor = await this.getInstructorProfileOrThrow(userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.deletedAt !== null) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    if (course.instructorId !== instructor.id) {
      throw new ForbiddenException({
        code: 'NOT_COURSE_OWNER',
        message: 'You are not the owner of this course',
      });
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }
}
