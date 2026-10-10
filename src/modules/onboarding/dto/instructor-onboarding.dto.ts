import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstructorPayoutDto {
  @ApiProperty({
    description: 'Bank code (e.g., 058 for GTBank)',
    example: '058',
  })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: 'Account number', example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    description: 'Account name registered with bank',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  accountName: string;
}

export class InstructorOnboardingDto {
  @ApiProperty({
    description: 'Instructor professional biography and credentials',
    example:
      'Senior Cloud Engineer with 10+ years designing enterprise architectures.',
  })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Areas of instruction or technical expertise',
    example: ['Cloud Architecture', 'DevOps', 'Distributed Systems'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expertise?: string[];

  @ApiPropertyOptional({
    type: InstructorPayoutDto,
    description:
      'Optional Nigerian bank details for Paystack subaccount/recipient setup',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstructorPayoutDto)
  payout?: InstructorPayoutDto;
}
