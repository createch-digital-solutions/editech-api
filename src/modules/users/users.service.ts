import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', module: 'users' };
  }

  // TODO: Implement user profile query and updates in Phase 6
}
