import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'App health check' })
  @ApiResponse({ status: 200, description: 'App is operational' })
  getApp() {
    return 'Editech API is operational';
  }
}
