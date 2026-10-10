import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CoursesService } from './courses.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Courses')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List course categories and counts (Phase 15 Index #12)',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories() {
    return this.coursesService.getCategories();
  }
}
