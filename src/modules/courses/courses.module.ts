import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CoursesController } from './courses.controller.js';
import { CategoriesController } from './categories.controller.js';
import { InstructorCoursesController } from './instructor-courses.controller.js';
import { CoursesService } from './courses.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    CoursesController,
    CategoriesController,
    InstructorCoursesController,
  ],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
