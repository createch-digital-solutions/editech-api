import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from '../../src/modules/gamification/gamification.controller.js';
import { GamificationService } from '../../src/modules/gamification/gamification.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('GamificationController', () => {
  let controller: GamificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        GamificationService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'gamification' });
  });
});
