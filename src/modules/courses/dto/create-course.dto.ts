import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, OutcomeTag } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'Product Management Fundamentals' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example:
      'Learn core PM principles, roadmapping, and agile execution tailored for high-growth tech.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: CourseLevel, example: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @ApiPropertyOptional({ example: 'PRODUCT_MANAGEMENT' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: OutcomeTag, example: OutcomeTag.GET_A_JOB })
  @IsEnum(OutcomeTag)
  @IsOptional()
  outcomeTag?: OutcomeTag;

  @ApiPropertyOptional({ example: 8000, description: 'Price in NGN' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.createch.io/thumbnails/pm-101.jpg',
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['Agile', 'Roadmapping'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
