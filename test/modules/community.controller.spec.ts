import { Test, TestingModule } from '@nestjs/testing';
import { CommunityController } from '../../src/modules/community/community.controller.js';
import { CommunityService } from '../../src/modules/community/community.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('CommunityController', () => {
  let controller: CommunityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityController],
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CommunityController>(CommunityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      module: 'community',
    });
  });
});
