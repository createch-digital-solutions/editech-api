import {
  Controller,
  Get,
  Post,
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
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { OnboardingService } from './onboarding.service.js';
import { LearnerOnboardingDto } from './dto/learner-onboarding.dto.js';
import { InstructorOnboardingDto } from './dto/instructor-onboarding.dto.js';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('learner')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.LEARNER, Role.ADMIN)
  @ApiOperation({ summary: 'Submit learner onboarding preferences (Phase 15)' })
  @ApiResponse({
    status: 200,
    description: 'Learner onboarding preferences persisted',
  })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  async onboardLearner(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LearnerOnboardingDto,
  ) {
    return this.onboardingService.onboardLearner(user.id, dto);
  }

  @Post('instructor')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Submit instructor application and bio details (Phase 15)',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor application submitted for review',
  })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  async onboardInstructor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InstructorOnboardingDto,
  ) {
    return this.onboardingService.onboardInstructor(user.id, dto);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check onboarding progression status and redirection target',
  })
  @ApiResponse({
    status: 200,
    description: 'Current onboarding lifecycle status retrieved',
  })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getOnboardingStatus(user.id);
  }
}
