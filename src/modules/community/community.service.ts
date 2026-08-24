import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'community' };
  }

  // TODO: Implement course discussion threads, student comments, and instructor answers in Phase 6
}
