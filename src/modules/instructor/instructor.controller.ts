import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InstructorService } from './instructor.service.js';

@ApiTags('Instructor')
@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get('health')
  @ApiOperation({ summary: 'Instructor module health check' })
  @ApiResponse({ status: 200, description: 'Instructor module is operational' })
  getHealth() {
    return this.instructorService.getHealth();
  }
}
