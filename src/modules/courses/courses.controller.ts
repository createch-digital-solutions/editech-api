import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { CourseQueryDto } from './dto/course-query.dto.js';
import { CourseSearchDto } from './dto/course-search.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Courses module health check' })
  @ApiResponse({ status: 200, description: 'Courses module is operational' })
  getHealth() {
    return this.coursesService.getHealth();
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List published courses with filters and pagination (Section 4.1)',
  })
  @ApiResponse({ status: 200, description: 'Courses list retrieved' })
  async listCourses(@Query() query: CourseQueryDto) {
    return this.coursesService.listCourses(query);
  }

  @Get('search')
  @Public()
  @ApiOperation({
    summary: 'Search published courses by keyword (Section 4.2)',
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 400, description: 'MISSING_QUERY' })
  async searchCourses(@Query() query: CourseSearchDto) {
    return this.coursesService.searchCourses(query);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured published courses' })
  @ApiResponse({ status: 200, description: 'Featured courses retrieved' })
  async getFeatured() {
    return this.coursesService.getFeaturedCourses();
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get course categories with counts' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories() {
    return this.coursesService.getCategories();
  }

  @Get(':slug')
  @Public()
  @ApiOperation({
    summary:
      'Get full course details, curriculum, and learner enrolment (Section 4.3)',
  })
  @ApiResponse({ status: 200, description: 'Course details retrieved' })
  @ApiResponse({ status: 404, description: 'COURSE_NOT_FOUND' })
  async getCourseBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.coursesService.getCourseBySlug(slug, user?.id);
  }

  @Get(':slug/preview')
  @Public()
  @ApiOperation({ summary: 'Get course preview curriculum and lessons' })
  @ApiResponse({ status: 200, description: 'Preview lessons retrieved' })
  @ApiResponse({ status: 404, description: 'COURSE_NOT_FOUND' })
  async getCoursePreview(@Param('slug') slug: string) {
    return this.coursesService.getCoursePreview(slug);
  }

  @Get(':id/reviews')
  @Public()
  @ApiOperation({ summary: 'Get reviews for a course' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async getReviews(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coursesService.getCourseReviews(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @Roles(Role.LEARNER)
  @ApiOperation({
    summary: 'Submit a review for a completed course (Section 4.4)',
  })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 400, description: 'INVALID_RATING' })
  @ApiResponse({ status: 403, description: 'COURSE_NOT_COMPLETED' })
  @ApiResponse({ status: 409, description: 'REVIEW_ALREADY_EXISTS' })
  async createReview(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.coursesService.createReview(id, user.id, dto);
  }
}
