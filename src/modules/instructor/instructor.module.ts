import { Module } from '@nestjs/common';
import { InstructorController } from './instructor.controller.js';
import { InstructorService } from './instructor.service.js';
import { S3Module } from '../s3/s3.module.js';

@Module({
  imports: [S3Module],
  controllers: [InstructorController],
  providers: [InstructorService],
  exports: [InstructorService],
})
export class InstructorModule {}
