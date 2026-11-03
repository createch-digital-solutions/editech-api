import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AiService } from './ai.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { GenerateCourseDto } from './dto/generate-course.dto.js';
import { TutorChatDto } from './dto/tutor-chat.dto.js';
import type { Response } from 'express';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'AI module health check' })
  @ApiResponse({ status: 200, description: 'AI module is operational' })
  getHealth() {
    return this.aiService.getHealth();
  }

  @Post('course-scaffold')
  @ApiBearerAuth()
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate structured curriculum outline (modules, lessons, quizzes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured course syllabus generated successfully',
  })
  async generateCourseScaffold(@Body() dto: GenerateCourseDto) {
    return this.aiService.generateCourseScaffold(dto);
  }

  @Post('tutor/chat')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Stream conversational tutoring response with Aria',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming token chunk response',
  })
  async streamTutorChat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TutorChatDto,
    @Res() res: Response,
  ) {
    return this.aiService.streamTutorChat(user.id, dto, res);
  }

  @Get('conversations')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get previous chat history with Aria' })
  @ApiQuery({ name: 'lessonId', required: false })
  async getConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('lessonId') lessonId?: string,
  ) {
    return this.aiService.getConversations(user.id, lessonId);
  }
}
