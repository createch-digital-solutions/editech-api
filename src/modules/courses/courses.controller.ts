import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CoursesService } from './courses.service.js';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Courses module health check' })
  @ApiResponse({ status: 200, description: 'Courses module is operational' })
  getHealth() {
    return this.coursesService.getHealth();
  }
}
