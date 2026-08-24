import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'admin' };
  }

  // TODO: Implement platform telemetry aggregation and audit logs in Phase 6
}
