import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../../src/modules/admin/admin.controller.js';
import { AdminService } from '../../src/modules/admin/admin.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'admin' });
  });
});
