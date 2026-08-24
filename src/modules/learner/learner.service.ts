import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LearnerService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'learner' };
  }

  // TODO: Implement learner enrollment retrieval and lesson player status in Phase 6
}
