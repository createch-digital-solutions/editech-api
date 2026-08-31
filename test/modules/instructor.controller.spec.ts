import { Test, TestingModule } from '@nestjs/testing';
import { InstructorController } from '../../src/modules/instructor/instructor.controller.js';
import { InstructorService } from '../../src/modules/instructor/instructor.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('InstructorController', () => {
  let controller: InstructorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstructorController],
      providers: [
        InstructorService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<InstructorController>(InstructorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      module: 'instructor',
    });
  });
});
