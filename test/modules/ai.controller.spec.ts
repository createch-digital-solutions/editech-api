import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from '../../src/modules/ai/ai.controller.js';
import { AiService } from '../../src/modules/ai/ai.service.js';

describe('AiController', () => {
  let controller: AiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [AiService],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'ai' });
  });
});
