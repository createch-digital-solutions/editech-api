import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'App health check' })
  @ApiResponse({ status: 200, description: 'App is operational' })
  getApp() {
    return 'Editech API is operational';
  }
}
