import {
  Controller,
  Post,
  Patch,
  Delete,
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
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';

@ApiTags('Instructor Courses')
@ApiBearerAuth()
@Roles(Role.INSTRUCTOR, Role.ADMIN)
@Controller('instructor')
export class InstructorCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('courses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new course draft (Section 6.1)',
  })
  @ApiResponse({ status: 201, description: 'Course draft created' })
  @ApiResponse({ status: 403, description: 'INSTRUCTOR_NOT_APPROVED' })
  @ApiResponse({ status: 422, description: 'PRICE_BELOW_MINIMUM' })
  async createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(user.id, dto);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update course metadata' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 403, description: 'NOT_COURSE_OWNER' })
  @ApiResponse({ status: 404, description: 'COURSE_NOT_FOUND' })
  async updateCourse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(id, user.id, dto);
  }

  @Post('courses/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit course for administrative review (Section 6.2)',
  })
  @ApiResponse({ status: 200, description: 'Course submitted for review' })
  @ApiResponse({ status: 403, description: 'NOT_COURSE_OWNER' })
  @ApiResponse({
    status: 422,
    description: 'COURSE_MISSING_THUMBNAIL / COURSE_HAS_NO_LESSONS',
  })
  async submitCourse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.submitCourseForReview(id, user.id);
  }

  @Post('courses/:id/sections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new section/module to course' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  @ApiResponse({ status: 403, description: 'NOT_COURSE_OWNER' })
  async addSection(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSectionDto,
  ) {
    return this.coursesService.addSection(id, user.id, dto);
  }

  @Post('sections/:id/lessons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new lesson to a course section' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiResponse({ status: 403, description: 'NOT_COURSE_OWNER' })
  async addLesson(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(id, user.id, dto);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Soft-delete course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 403, description: 'NOT_COURSE_OWNER' })
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.deleteCourse(id, user.id);
  }
}
