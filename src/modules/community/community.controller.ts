import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommunityService } from './community.service.js';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('health')
  @ApiOperation({ summary: 'Community module health check' })
  @ApiResponse({ status: 200, description: 'Community module is operational' })
  getHealth() {
    return this.communityService.getHealth();
  }
}
