import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CourseStatus, EnrolmentStatus, TransactionStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LearnerService {
  private readonly logger = new Logger(LearnerService.name);

  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'learner' };
  }

  /**
   * Enroll a learner in a course by course ID or slug.
   * Free courses enroll immediately; paid courses verify successful transaction.
   */
  async enrollInCourse(
    learnerId: string,
    courseIdOrSlug: string,
    userRole?: Role | string,
  ) {
    this.logger.log(
      `Learner ${learnerId} enrolling in course ${courseIdOrSlug} (role: ${userRole ?? 'unknown'})`,
    );

    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
        deletedAt: null,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: `Course '${courseIdOrSlug}' not found`,
      });
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException({
        code: 'COURSE_NOT_PUBLISHED',
        message: 'Cannot enroll in an unpublished course',
      });
    }

    // Check existing enrolment (idempotent)
    const existingEnrolment = await this.prisma.enrolment.findUnique({
      where: {
        learnerId_courseId: {
          learnerId,
          courseId: course.id,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            totalLessons: true,
            totalDuration: true,
          },
        },
      },
    });

    if (existingEnrolment) {
      return {
        message: 'Already enrolled in course',
        enrolment: {
          id: existingEnrolment.id,
          courseId: existingEnrolment.courseId,
          status: existingEnrolment.status,
          progress: Number(existingEnrolment.progress),
          progressPercentage: Math.round(Number(existingEnrolment.progress)),
          enrolledAt: existingEnrolment.enrolledAt,
          completedAt: existingEnrolment.completedAt,
          course: existingEnrolment.course,
        },
      };
    }

    // Check payment requirement
    const isFreeCourse = course.isFree || Number(course.price) === 0;
    if (!isFreeCourse) {
      const successfulTransaction = await this.prisma.transaction.findFirst({
        where: {
          learnerId,
          courseId: course.id,
          status: TransactionStatus.SUCCESS,
        },
      });

      const isInstructorOwner = course.instructor?.userId === learnerId;
      const isAdmin = userRole === Role.ADMIN;

      if (!successfulTransaction && !isInstructorOwner && !isAdmin) {
        throw new ForbiddenException({
          code: 'PAYMENT_REQUIRED',
          message: 'Payment is required to enroll in this course',
          courseId: course.id,
          price: Number(course.price),
        });
      }
    }

    // Create enrolment and increment enrolment counters atomically
    const enrolment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.enrolment.create({
        data: {
          learnerId,
          courseId: course.id,
          status: EnrolmentStatus.ACTIVE,
          progress: 0,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
              totalLessons: true,
              totalDuration: true,
            },
          },
        },
      });

      await tx.course.update({
        where: { id: course.id },
        data: {
          enrolmentCount: { increment: 1 },
        },
      });

      if (course.instructorId) {
        await tx.instructorProfile.update({
          where: { id: course.instructorId },
          data: {
            totalStudents: { increment: 1 },
          },
        });
      }

      return created;
    });

    this.logger.log(
      `Learner ${learnerId} successfully enrolled in course ${course.slug} (${course.id})`,
    );

    return {
      message: 'Enrolled successfully',
      enrolment: {
        id: enrolment.id,
        courseId: enrolment.courseId,
        status: enrolment.status,
        progress: Number(enrolment.progress),
        progressPercentage: 0,
        enrolledAt: enrolment.enrolledAt,
        completedAt: enrolment.completedAt,
        course: enrolment.course,
      },
    };
  }

  /**
   * Retrieve all course enrolments with progress and course metadata for the learner.
   */
  async getEnrolments(learnerId: string) {
    const enrolments = await this.prisma.enrolment.findMany({
      where: { learnerId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnailUrl: true,
            category: true,
            level: true,
            totalLessons: true,
            totalDuration: true,
            averageRating: true,
            reviewCount: true,
            instructor: {
              select: {
                id: true,
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
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return enrolments.map((e) => {
      const instructorUser = e.course?.instructor?.user;
      const instructorName = instructorUser
        ? `${instructorUser.firstName} ${instructorUser.lastName}`.trim()
        : 'Instructor';

      return {
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        progress: Number(e.progress),
        progressPercentage: Math.round(Number(e.progress)),
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        course: {
          id: e.course.id,
          title: e.course.title,
          slug: e.course.slug,
          description: e.course.description,
          thumbnailUrl: e.course.thumbnailUrl,
          category: e.course.category,
          level: e.course.level,
          totalLessons: e.course.totalLessons,
          totalDuration: e.course.totalDuration,
          averageRating: Number(e.course.averageRating),
          reviewCount: e.course.reviewCount,
          instructorName,
          instructorAvatar: instructorUser?.avatarUrl ?? null,
        },
      };
    });
  }

  /**
   * Check enrolment status for a single course.
   */
  async getEnrolmentByCourse(learnerId: string, courseIdOrSlug: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
        deletedAt: null,
      },
    });

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: `Course '${courseIdOrSlug}' not found`,
      });
    }

    const enrolment = await this.prisma.enrolment.findUnique({
      where: {
        learnerId_courseId: {
          learnerId,
          courseId: course.id,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            totalLessons: true,
            totalDuration: true,
          },
        },
      },
    });

    if (!enrolment) {
      return null;
    }

    return {
      id: enrolment.id,
      courseId: enrolment.courseId,
      status: enrolment.status,
      progress: Number(enrolment.progress),
      progressPercentage: Math.round(Number(enrolment.progress)),
      enrolledAt: enrolment.enrolledAt,
      completedAt: enrolment.completedAt,
      course: enrolment.course,
    };
  }
}
