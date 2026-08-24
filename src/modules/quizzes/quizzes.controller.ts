import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service.js';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Quizzes module health check' })
  @ApiResponse({ status: 200, description: 'Quizzes module is operational' })
  getHealth() {
    return this.quizzesService.getHealth();
  }
}
