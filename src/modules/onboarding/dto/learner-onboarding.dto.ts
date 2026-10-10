import { IsString, IsNotEmpty, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel } from '@prisma/client';

export class LearnerOnboardingDto {
  @ApiProperty({
    description: 'Primary career goal or objective',
    example: 'Become a full-stack engineer',
  })
  @IsString()
  @IsNotEmpty()
  careerGoal: string;

  @ApiProperty({
    enum: SkillLevel,
    description: 'Self-assessed current skill level',
    example: SkillLevel.BEGINNER,
  })
  @IsEnum(SkillLevel)
  @IsNotEmpty()
  skillLevel: SkillLevel;

  @ApiPropertyOptional({
    type: [String],
    description: 'Topics or areas of interest',
    example: ['Web Development', 'AI & Machine Learning'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}
