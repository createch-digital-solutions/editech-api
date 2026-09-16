import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { Role, UserStatus } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../../modules/prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid auth token',
      });
    }

    const token = authHeader.substring(7).trim();

    try {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) {
        throw new Error('CLERK_SECRET_KEY is not configured');
      }

      const verified = await verifyToken(token, { secretKey });
      const clerkId = verified.sub;

      if (!clerkId) {
        throw new UnauthorizedException({
          code: 'UNAUTHORIZED',
          message: 'Token does not contain a valid subject claim',
        });
      }

      // Resolve user from Postgres database
      let user = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      // Auto-provision if user exists in Clerk but hasn't synced via webhook yet
      if (!user) {
        const claims = verified as Record<string, unknown>;
        const email =
          (claims.email as string) ||
          (claims.primary_email_address as string) ||
          `${clerkId}@createch.placeholder`;
        const firstName = (claims.first_name as string) || 'Createch';
        const lastName = (claims.last_name as string) || 'User';
        const role = (claims.role as Role) || Role.LEARNER;

        user = await this.prisma.user.create({
          data: {
            clerkId,
            email,
            firstName,
            lastName,
            role,
            status: UserStatus.ACTIVE,
            learnerProfile: {
              create: {
                totalXp: 0,
                currentLevel: 1,
                streakDays: 0,
              },
            },
            streakRecord: {
              create: {
                currentStreak: 0,
                longestStreak: 0,
              },
            },
          },
        });
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException({
          code: 'USER_SUSPENDED',
          message: 'Your account has been suspended.',
        });
      }

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
      };

      request.user = authenticatedUser;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }

      if (isPublic) {
        return true;
      }

      this.logger.warn(
        `Auth token verification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid auth token',
      });
    }
  }
}
