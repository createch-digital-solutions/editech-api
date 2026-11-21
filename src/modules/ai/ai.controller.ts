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
import { TodayUsageResponseDto } from './dto/today-usage.dto.js';
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
    summary:
      'Generate structured curriculum outline (modules, lessons, quizzes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured course syllabus generated successfully',
  })
  @ApiResponse({
    status: 429,
    description:
      'AI_RATE_LIMIT_EXCEEDED: Daily instructor AI generation quota reached',
  })
  async generateCourseScaffold(
    @Body() dto: GenerateCourseDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.aiService.generateCourseScaffold(dto, user?.id, user?.role);
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
  @ApiResponse({
    status: 429,
    description:
      'DAILY_LIMIT_REACHED: Daily learner AI tutor exchange limit reached',
  })
  async streamTutorChat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TutorChatDto,
    @Res() res: Response,
  ) {
    return this.aiService.streamTutorChat(user.id, dto, res, user.role);
  }

  @Get('usage/today')
  @ApiBearerAuth()
  @Roles(Role.LEARNER, Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary:
      "Get current user's AI token and exchange usage with remaining quota for today (Phase 15 #43)",
  })
  @ApiResponse({
    status: 200,
    description: "Today's AI usage and quota returned",
    type: TodayUsageResponseDto,
  })
  async getTodayUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getTodayUsage(user.id, user.role);
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
