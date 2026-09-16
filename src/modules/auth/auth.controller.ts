import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Auth module health check' })
  @ApiResponse({ status: 200, description: 'Auth module is operational' })
  getHealth() {
    return this.authService.getHealth();
  }

  @Post('webhook/clerk')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clerk Webhook Endpoint (Phase 15 specification)',
  })
  @ApiResponse({ status: 200, description: 'Webhook received & synced' })
  @ApiResponse({ status: 400, description: 'INVALID_WEBHOOK_SIGNATURE' })
  async handleClerkWebhook(
    @Req() req: Request,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: 'Missing required Svix signature headers',
      });
    }

    const payload = req.rawBody || JSON.stringify(req.body);

    return this.authService.handleClerkWebhook(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  }

  // Backwards compatibility alias for /api/v1/auth/webhook
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clerk Webhook Alias' })
  async handleWebhookAlias(
    @Req() req: Request,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    return this.handleClerkWebhook(req, svixId, svixTimestamp, svixSignature);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @Patch('role')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  async updateRole(
    @CurrentUser() _admin: AuthenticatedUser,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.authService.updateUserRole(dto.userId, dto.role);
  }
}
