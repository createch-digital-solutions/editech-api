import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InstructorService } from './instructor.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Instructor')
@ApiBearerAuth()
@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get('health')
  @ApiOperation({ summary: 'Instructor module health check' })
  @ApiResponse({ status: 200, description: 'Instructor module is operational' })
  getHealth() {
    return this.instructorService.getHealth();
  }

  @Post('lessons/:id/upload-url')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      'Generate pre-signed Cloudflare R2 upload URL for lesson video (Phase 14 Flow B)',
  })
  @ApiResponse({ status: 200, description: 'Signed upload URL generated' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'LESSON_NOT_FOUND' })
  async getLessonUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') lessonId: string,
    @Body('contentType') contentType?: string,
  ) {
    return this.instructorService.getLessonUploadUrl(
      user.id,
      lessonId,
      contentType || 'video/mp4',
    );
  }

  @Post('lessons/:id/upload-complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Notify server that direct R2 upload has completed',
  })
  @ApiResponse({ status: 200, description: 'Upload completed and registered' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'LESSON_NOT_FOUND' })
  async completeLessonUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') lessonId: string,
    @Body('key') key: string,
  ) {
    return this.instructorService.completeLessonUpload(user.id, lessonId, key);
  }
}
