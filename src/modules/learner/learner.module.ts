import { Module } from '@nestjs/common';
import { LearnerController } from './learner.controller.js';
import { LearnerService } from './learner.service.js';

@Module({
  controllers: [LearnerController],
  providers: [LearnerService],
  exports: [LearnerService],
})
export class LearnerModule {}
