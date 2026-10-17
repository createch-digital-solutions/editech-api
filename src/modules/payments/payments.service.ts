import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../queue/queue.constants.js';
import { paystackClient } from '../../common/clients/paystack.client.js';
import { stripeClient } from '../../common/clients/stripe.client.js';
import type { PaymentWebhookJobPayload } from './processors/payments.processor.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.PAYMENTS)
    private readonly paymentsQueue: Queue<PaymentWebhookJobPayload>,
  ) {}

  getHealth() {
    return { status: 'ok', module: 'payments' };
  }

  /**
   * Phase 14 Flow A: Synchronous checkout initiation (<1s)
   */
  async initiatePayment(params: {
    userId: string;
    courseId: string;
    currency: 'NGN' | 'USD';
    email: string;
    amount: number;
  }) {
    this.logger.log(
      `Initiating checkout for user ${params.userId}, course ${params.courseId} in ${params.currency}`,
    );

    if (params.currency === 'NGN') {
      const reference = `cd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      try {
        const paystackRes = await paystackClient.initializeTransaction({
          email: params.email,
          amount: params.amount * 100, // kobo
          reference,
        });
        return {
          provider: 'paystack',
          checkoutUrl: paystackRes.authorization_url,
          reference: paystackRes.reference,
        };
      } catch (err) {
        this.logger.warn(
          `Paystack stub fallback: ${err instanceof Error ? err.message : String(err)}`,
        );
        return {
          provider: 'paystack',
          checkoutUrl: `https://checkout.paystack.com/stub_${reference}`,
          reference,
          mode: 'stub',
        };
      }
    } else {
      try {
        const stripeRes = await stripeClient.createCheckoutSession({
          amount: params.amount,
          currency: 'usd',
          courseId: params.courseId,
        });
        return {
          provider: 'stripe',
          checkoutUrl: stripeRes.url,
        };
      } catch (err) {
        this.logger.warn(
          `Stripe stub fallback: ${err instanceof Error ? err.message : String(err)}`,
        );
        return {
          provider: 'stripe',
          checkoutUrl: `https://checkout.stripe.com/pay/stub_${params.courseId}`,
          mode: 'stub',
        };
      }
    }
  }

  /**
   * Phase 14 Flow A: Asynchronous webhook acknowledgement and queuing (<200ms ACK)
   */
  async queueWebhook(payload: PaymentWebhookJobPayload) {
    this.logger.log(`Enqueuing payment webhook from ${payload.provider}`);
    await this.paymentsQueue.add(JOB_NAMES.PAYMENTS.PROCESS_WEBHOOK, payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: 50,
    });

    return { received: true, queued: true };
  }
}
