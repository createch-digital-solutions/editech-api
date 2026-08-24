import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'courses' };
  }

  // TODO: Implement course search, filtering, and detail fetching in Phase 6
}
