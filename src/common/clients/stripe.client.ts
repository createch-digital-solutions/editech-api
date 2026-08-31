import Stripe from 'stripe';

/**
 * Stripe Client Wrapper (USD & International Checkout)
 */
export class StripeClientWrapper {
  private client: Stripe | null = null;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (apiKey && !apiKey.includes('placeholder')) {
      this.client = new Stripe(apiKey, {
        apiVersion: '2026-03-27.acacia' as Stripe.LatestApiVersion,
      });
    }
  }

  // TODO: Implement Stripe checkout session creation in Phase 6
  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    courseId: string;
  }): Promise<{ url: string }> {
    if (!this.client) {
      throw new Error('Stripe client is not configured or in stub mode.');
    }
    throw new Error(
      'Stripe checkout is not implemented yet. Scheduled for Phase 6.',
    );
  }
}

export const stripeClient = new StripeClientWrapper();
