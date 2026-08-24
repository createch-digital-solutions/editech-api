import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesController } from '../../src/modules/certificates/certificates.controller.js';
import { CertificatesService } from '../../src/modules/certificates/certificates.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';

describe('CertificatesController', () => {
  let controller: CertificatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [
        CertificatesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CertificatesController>(CertificatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'certificates' });
  });
});
