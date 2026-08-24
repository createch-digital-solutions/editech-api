import { PrismaService } from '../src/modules/prisma/prisma.service.js';

describe('Prisma Integration Smoke Test', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should initialize Prisma Client instance cleanly', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });

  it('should have foundational model delegates defined', () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.course).toBeDefined();
    expect(prisma.enrolment).toBeDefined();
  });
});
