import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../../src/modules/payments/payments.controller.js';
import { PaymentsService } from '../../src/modules/payments/payments.service.js';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            getHealth: () => ({ status: 'ok', module: 'payments' }),
            initiatePayment: () =>
              Promise.resolve({
                provider: 'paystack',
                checkoutUrl: 'https://paystack.com',
              }),
            queueWebhook: () =>
              Promise.resolve({ received: true, queued: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      module: 'payments',
    });
  });
});
