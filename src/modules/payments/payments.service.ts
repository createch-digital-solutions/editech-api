import { Injectable } from '@nestjs/common';
import { paystackClient } from '../../common/clients/paystack.client.js';
import { stripeClient } from '../../common/clients/stripe.client.js';

@Injectable()
export class PaymentsService {
  getHealth() {
    return { status: 'ok', module: 'payments' };
  }

  // TODO: Connect Paystack NGN checkout in Phase 6
  async initPaystack(params: { email: string; amount: number; reference: string }) {
    return paystackClient.initializeTransaction(params);
  }

  // TODO: Connect Stripe USD checkout in Phase 6
  async initStripe(params: { amount: number; currency: string; courseId: string }) {
    return stripeClient.createCheckoutSession(params);
  }
}
