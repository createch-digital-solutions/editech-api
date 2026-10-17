import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsProcessor } from './processors/payments.processor.js';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsProcessor],
  exports: [PaymentsService],
})
export class PaymentsModule {}
