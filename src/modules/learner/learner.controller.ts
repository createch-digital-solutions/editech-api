import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LearnerService } from './learner.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { EnrollCourseDto } from './dto/enroll-course.dto.js';

@ApiTags('Learner')
@Controller('learner')
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Learner module health check' })
  @ApiResponse({ status: 200, description: 'Learner module is operational' })
  getHealth() {
    return this.learnerService.getHealth();
  }

  @Get('enrolments')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get all enrolled courses and progress for the current learner' })
  @ApiResponse({ status: 200, description: 'List of course enrolments returned successfully' })
  getEnrolments(@CurrentUser() user: AuthenticatedUser) {
    return this.learnerService.getEnrolments(user.id);
  }

  @Get('enrolments/:courseId')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Check enrolment status and progress for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID or slug' })
  @ApiResponse({ status: 200, description: 'Enrolment status details or null if not enrolled' })
  getEnrolmentByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.learnerService.getEnrolmentByCourse(user.id, courseId);
  }

  @Post('courses/:courseId/enroll')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll in a course by course ID or slug (URL parameter)' })
  @ApiParam({ name: 'courseId', description: 'Course UUID or slug' })
  @ApiResponse({ status: 200, description: 'Successfully enrolled in course' })
  @ApiResponse({ status: 403, description: 'Payment required for paid courses' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  enrollInCourseByParam(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.learnerService.enrollInCourse(user.id, courseId, user.role);
  }

  @Post('enrolments')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll in a course by request body (JSON payload)' })
  @ApiResponse({ status: 200, description: 'Successfully enrolled in course' })
  @ApiResponse({ status: 403, description: 'Payment required for paid courses' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  enrollInCourseByBody(
    @Body() dto: EnrollCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.learnerService.enrollInCourse(user.id, dto.courseId, user.role);
  }
}
