import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, OutcomeTag } from '@prisma/client';

export class GenerateCourseDto {
  @ApiProperty({
    description: 'Prompt describing the desired course topic, audience, and scope',
    example: 'Build production microservices with NestJS, Apache Kafka, and Docker for intermediate developers',
  })
  @IsString()
  @MinLength(10)
  prompt!: string;

  @ApiPropertyOptional({ enum: CourseLevel, default: CourseLevel.INTERMEDIATE })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel = CourseLevel.INTERMEDIATE;

  @ApiPropertyOptional({ enum: OutcomeTag, default: OutcomeTag.GET_A_JOB })
  @IsOptional()
  @IsEnum(OutcomeTag)
  outcomeTag?: OutcomeTag = OutcomeTag.GET_A_JOB;

  @ApiPropertyOptional({ description: 'Target category', example: 'Backend Development' })
  @IsOptional()
  @IsString()
  category?: string;
}
