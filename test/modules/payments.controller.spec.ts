import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../../src/modules/payments/payments.controller.js';
import { PaymentsService } from '../../src/modules/payments/payments.service.js';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [PaymentsService],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'payments' });
  });
});
