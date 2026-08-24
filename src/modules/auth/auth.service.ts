import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'auth' };
  }

  async handleClerkWebhook(payload: string, headers: Record<string, string>) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      this.logger.warn('Clerk webhook secret is in stub/placeholder mode');
      return { status: 'stub_mode_acknowledged' };
    }

    try {
      const { Webhook } = await import('svix');
      const wh = new Webhook(webhookSecret);
      const evt = wh.verify(payload, headers) as { type: string; data: unknown };
      this.logger.log(`Received Clerk Webhook: ${evt.type}`);

      // TODO: Handle user.created, user.updated, user.deleted sync into Prisma in Phase 6
      return { received: true, type: evt.type };
    } catch (err) {
      this.logger.error('Error verifying Clerk webhook signature', err);
      throw err;
    }
  }
}
