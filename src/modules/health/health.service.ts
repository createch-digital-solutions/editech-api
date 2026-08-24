import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    let databaseStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'up';
    } catch {
      databaseStatus = 'down';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        meilisearch: 'stub',
      },
    };
  }
}
