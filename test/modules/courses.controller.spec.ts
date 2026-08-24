import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../../src/modules/courses/courses.controller.js';
import { CoursesService } from '../../src/modules/courses/courses.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('CoursesController', () => {
  let controller: CoursesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'courses' });
  });
});
