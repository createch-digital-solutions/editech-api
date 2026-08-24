import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'quizzes' };
  }

  // TODO: Implement quiz question authoring, instant grading, and attempt limits in Phase 6
}
