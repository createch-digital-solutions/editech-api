import { Resend } from 'resend';

/**
 * Resend Email Client Wrapper
 */
export class ResendClientWrapper {
  private client: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && !apiKey.includes('placeholder')) {
      this.client = new Resend(apiKey);
    }
  }

  // TODO: Implement transactional email sending in Phase 6
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ id: string }> {
    if (!this.client) {
      throw new Error('Resend client is not configured or in stub mode.');
    }
    throw new Error(
      'Resend email delivery is not implemented yet. Scheduled for Phase 6.',
    );
  }
}

export const resendClient = new ResendClientWrapper();
