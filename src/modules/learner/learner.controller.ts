import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LearnerService } from './learner.service.js';

@ApiTags('Learner')
@Controller('learner')
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Get('health')
  @ApiOperation({ summary: 'Learner module health check' })
  @ApiResponse({ status: 200, description: 'Learner module is operational' })
  getHealth() {
    return this.learnerService.getHealth();
  }
}
