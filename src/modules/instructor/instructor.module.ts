import { Module } from '@nestjs/common';
import { InstructorController } from './instructor.controller.js';
import { InstructorService } from './instructor.service.js';

@Module({
  controllers: [InstructorController],
  providers: [InstructorService],
  exports: [InstructorService],
})
export class InstructorModule {}
