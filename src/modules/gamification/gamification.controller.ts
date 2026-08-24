import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GamificationService } from './gamification.service.js';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Gamification module health check' })
  @ApiResponse({ status: 200, description: 'Gamification module is operational' })
  getHealth() {
    return this.gamificationService.getHealth();
  }
}
