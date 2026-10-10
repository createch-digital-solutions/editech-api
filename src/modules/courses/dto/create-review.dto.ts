import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Star rating from 1 to 5',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review text feedback',
    example: 'Excellent course, very relevant to the Nigerian job market.',
  })
  @IsString()
  @IsOptional()
  reviewText?: string;
}
