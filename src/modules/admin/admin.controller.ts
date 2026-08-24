import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'Admin module health check' })
  @ApiResponse({ status: 200, description: 'Admin module is operational' })
  getHealth() {
    return this.adminService.getHealth();
  }
}
