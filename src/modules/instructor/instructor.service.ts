import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'instructor' };
  }

  // TODO: Implement instructor course builder and student review analytics in Phase 6
}
