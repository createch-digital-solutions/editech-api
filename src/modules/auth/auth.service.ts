import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { createClerkClient } from '@clerk/backend';
import { Webhook } from 'svix';
import { PrismaService } from '../prisma/prisma.service.js';

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkWebhookUserData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  public_metadata?: {
    role?: string;
  };
  unsafe_metadata?: {
    role?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'auth' };
  }

  /**
   * Handle incoming Clerk webhooks with Svix signature verification.
   * Syncs user lifecycle (create, update, delete) to PostgreSQL.
   */
  async handleClerkWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
  ) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      this.logger.warn('Clerk webhook secret is in stub/placeholder mode');
      return { synced: true, mode: 'stub' };
    }

    let evt: { type: string; data: unknown };

    try {
      const wh = new Webhook(webhookSecret);
      const payloadString =
        typeof payload === 'string' ? payload : payload.toString('utf-8');
      evt = wh.verify(payloadString, headers) as {
        type: string;
        data: unknown;
      };
    } catch (err) {
      this.logger.error('Failed to verify Clerk webhook signature', err);
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: 'Webhook signature verification failed',
      });
    }

    this.logger.log(`Processing Clerk webhook event: ${evt.type}`);

    switch (evt.type) {
      case 'user.created': {
        const data = evt.data as ClerkWebhookUserData;
        const clerkId = data.id;
        const primaryEmail = data.email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          this.logger.error(`Clerk user ${clerkId} has no email address`);
          throw new BadRequestException({
            code: 'EMAIL_REQUIRED',
            message: 'User must have an email address',
          });
        }

        const existingUser = await this.prisma.user.findUnique({
          where: { clerkId },
        });

        if (existingUser) {
          this.logger.warn(`User with clerkId ${clerkId} already exists`);
          return { synced: true, message: 'User already exists' };
        }

        // SECURITY: ADMIN role is strictly prohibited from webhook assignment.
        // It can only be assigned directly in the database or via an authenticated Admin API endpoint.
        const rawRole =
          data.public_metadata?.role || data.unsafe_metadata?.role;
        let role: Role = Role.LEARNER;
        if (typeof rawRole === 'string') {
          const upper = rawRole.toUpperCase();
          if (upper === 'INSTRUCTOR') {
            role = Role.INSTRUCTOR;
          }
          // Any attempt to set ADMIN or invalid roles is ignored and defaults to LEARNER.
        }

        const status = UserStatus.ACTIVE;

        await this.prisma.user.create({
          data: {
            clerkId,
            email: primaryEmail,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            avatarUrl: data.image_url || null,
            role,
            status,
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
            ...(role === Role.INSTRUCTOR
              ? {
                  instructorProfile: {
                    create: {
                      status: 'PENDING',
                    },
                  },
                }
              : {}),
          },
        });

        // Ensure role and status are written to Clerk publicMetadata so JWT tokens contain them
        try {
          await this.clerk.users.updateUserMetadata(clerkId, {
            publicMetadata: {
              role,
              status,
            },
          });
          this.logger.log(
            `Synced role ${role} and status ${status} to Clerk publicMetadata for ${clerkId}`,
          );
        } catch (syncErr) {
          this.logger.warn(
            `Could not sync metadata to Clerk for user ${clerkId}: ${syncErr}`,
          );
        }

        this.logger.log(
          `Created user ${primaryEmail} from Clerk webhook with role ${role}`,
        );
        return { synced: true };
      }

      case 'user.updated': {
        const data = evt.data as ClerkWebhookUserData;
        const clerkId = data.id;
        const primaryEmail = data.email_addresses?.[0]?.email_address;
        const updatedRawRole =
          data.public_metadata?.role || data.unsafe_metadata?.role;
        let updatedRole: Role | undefined;
        if (typeof updatedRawRole === 'string') {
          const upper = updatedRawRole.toUpperCase();
          // SECURITY: Only allow safe role updates via webhook; never allow escalation to ADMIN.
          if (upper === 'INSTRUCTOR') {
            updatedRole = Role.INSTRUCTOR;
          } else if (upper === 'LEARNER') {
            updatedRole = Role.LEARNER;
          }
        }

        await this.prisma.user.updateMany({
          where: { clerkId },
          data: {
            ...(primaryEmail ? { email: primaryEmail } : {}),
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            avatarUrl: data.image_url || null,
            ...(updatedRole ? { role: updatedRole } : {}),
          },
        });

        this.logger.log(`Updated user ${clerkId} from Clerk webhook`);
        return { synced: true };
      }

      case 'user.deleted': {
        const data = evt.data as { id: string };
        const clerkId = data.id;

        // Phase 13 soft delete policy: preserve records for audit
        await this.prisma.user.updateMany({
          where: { clerkId },
          data: {
            deletedAt: new Date(),
            status: UserStatus.SUSPENDED,
          },
        });

        this.logger.log(`Soft-deleted user ${clerkId} from Clerk webhook`);
        return { synced: true };
      }

      default:
        this.logger.log(`Unhandled Clerk webhook event type: ${evt.type}`);
        return { synced: true, unhandled: true };
    }
  }

  /**
   * Return authenticated user profile.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update a user's role (Admin-only).
   * Syncs to both PostgreSQL and Clerk publicMetadata.
   */
  async updateUserRole(targetUserId: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User to update was not found',
      });
    }

    // 1. Update in local Postgres database
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    // 2. Sync to Clerk's publicMetadata so role is baked into future session tokens
    try {
      await this.clerk.users.updateUserMetadata(user.clerkId, {
        publicMetadata: {
          role: newRole,
        },
      });
      this.logger.log(`Synced role ${newRole} for clerkId ${user.clerkId}`);
    } catch (err) {
      this.logger.error(
        `Failed to sync role to Clerk for user ${user.clerkId}`,
        err,
      );
    }

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      updatedAt: updated.updatedAt,
    };
  }
}
