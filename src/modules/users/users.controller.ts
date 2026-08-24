import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  @ApiOperation({ summary: 'Users module health check' })
  @ApiResponse({ status: 200, description: 'Users module is operational' })
  getHealth() {
    return this.usersService.getHealth();
  }
}
