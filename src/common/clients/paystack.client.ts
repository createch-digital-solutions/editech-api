/**
 * Paystack Client Wrapper (NGN / Nigerian Local Payments)
 */
export class PaystackClientWrapper {
  private secretKey: string | null = null;

  constructor() {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (key && !key.includes('placeholder')) {
      this.secretKey = key;
    }
  }

  // TODO: Implement Paystack charge initialization & webhook verification in Phase 6
  async initializeTransaction(params: {
    email: string;
    amount: number; // in kobo
    reference: string;
  }): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> {
    if (!this.secretKey) {
      throw new Error('Paystack client is not configured or in stub mode.');
    }
    throw new Error(
      'Paystack transactions are not implemented yet. Scheduled for Phase 6.',
    );
  }
}

export const paystackClient = new PaystackClientWrapper();
