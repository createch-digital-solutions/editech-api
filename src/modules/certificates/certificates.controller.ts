import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service.js';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Certificates module health check' })
  @ApiResponse({
    status: 200,
    description: 'Certificates module is operational',
  })
  getHealth() {
    return this.certificatesService.getHealth();
  }
}
