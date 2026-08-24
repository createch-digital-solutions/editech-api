import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Payments module health check' })
  @ApiResponse({ status: 200, description: 'Payments module is operational' })
  getHealth() {
    return this.paymentsService.getHealth();
  }
}
