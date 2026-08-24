import { Test, TestingModule } from '@nestjs/testing';
import { LearnerController } from '../../src/modules/learner/learner.controller.js';
import { LearnerService } from '../../src/modules/learner/learner.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('LearnerController', () => {
  let controller: LearnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearnerController],
      providers: [
        LearnerService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LearnerController>(LearnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'learner' });
  });
});
