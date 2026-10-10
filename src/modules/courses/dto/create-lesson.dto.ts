import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({ example: 'What is a Product Manager?' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ enum: LessonType, default: LessonType.VIDEO })
  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType = LessonType.VIDEO;

  @ApiPropertyOptional({
    example: 'https://cdn.createch.io/videos/pm-lesson-1.mp4',
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 720, description: 'Duration in seconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  videoDuration?: number;

  @ApiPropertyOptional({ example: 'Markdown text notes for this lesson...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'True if available as free preview',
  })
  @IsBoolean()
  @IsOptional()
  isPreview?: boolean;
}
