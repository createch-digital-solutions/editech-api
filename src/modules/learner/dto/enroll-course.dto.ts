import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollCourseDto {
  @ApiProperty({
    description: 'Course ID or unique slug to enroll in',
    example: 'ui-ux-design-systems',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
