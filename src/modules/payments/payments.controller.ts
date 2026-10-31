import {
  Controller,
  Get,
  Post,
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
import crypto from 'crypto';
import { PaymentsService } from './payments.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';

interface PaystackWebhookPayload {
  event?: string;
  data?: {
    reference?: string;
    [key: string]: unknown;
  };
}

interface StripeWebhookPayload {
  type?: string;
  data?: {
    object?: {
      id?: string;
      [key: string]: unknown;
    };
  };
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Payments module health check' })
  @ApiResponse({ status: 200, description: 'Payments module is operational' })
  getHealth() {
    return this.paymentsService.getHealth();
  }

  @Post('initiate')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initialize course checkout (Paystack NGN / Stripe USD)',
  })
  @ApiResponse({ status: 200, description: 'Checkout URL returned' })
  async initiate(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: {
      courseId: string;
      currency?: 'NGN' | 'USD';
      amount: number;
    },
  ) {
    return this.paymentsService.initiatePayment({
      userId: user.id,
      courseId: dto.courseId,
      currency: dto.currency || 'NGN',
      email: user.email,
      amount: dto.amount,
    });
  }

  @Post('webhook/paystack')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack payment webhook endpoint (queued ACK)' })
  @ApiResponse({ status: 200, description: 'Webhook received & queued' })
  async handlePaystackWebhook(
    @Req() req: Request,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret && !secret.includes('placeholder')) {
      const payload = req.rawBody || JSON.stringify(req.body);
      const hash = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

      if (hash !== signature) {
        throw new BadRequestException('INVALID_PAYSTACK_SIGNATURE');
      }
    }

    const body = (req.body ?? {}) as PaystackWebhookPayload;
    return this.paymentsService.queueWebhook({
      provider: 'paystack',
      event: body.event || 'charge.success',
      data: body.data || {},
      reference: body.data?.reference,
    });
  }

  @Post('webhook/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe payment webhook endpoint (queued ACK)' })
  @ApiResponse({ status: 200, description: 'Webhook received & queued' })
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature?: string,
  ) {
    const body = (req.body ?? {}) as StripeWebhookPayload;
    return this.paymentsService.queueWebhook({
      provider: 'stripe',
      event: body.type || 'checkout.session.completed',
      data: body.data?.object || {},
      reference: body.data?.object?.id || signature,
    });
  }
}
