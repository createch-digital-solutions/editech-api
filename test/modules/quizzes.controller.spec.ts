import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from '../../src/modules/quizzes/quizzes.controller.js';
import { QuizzesService } from '../../src/modules/quizzes/quizzes.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('QuizzesController', () => {
  let controller: QuizzesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [
        QuizzesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<QuizzesController>(QuizzesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'quizzes' });
  });
});
