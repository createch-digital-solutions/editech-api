import { ApiProperty } from '@nestjs/swagger';

export class QuotaDetailDto {
  @ApiProperty({ example: 15, description: 'Maximum daily allowed exchanges' })
  maxExchanges!: number;

  @ApiProperty({ example: 100000, description: 'Maximum daily allowed tokens' })
  maxTokens!: number;
}

export class QuotaRemainingDto {
  @ApiProperty({ example: 12, description: 'Remaining exchanges today' })
  exchanges!: number;

  @ApiProperty({ example: 95500, description: 'Remaining tokens today' })
  tokens!: number;
}

export class TodayUsageResponseDto {
  @ApiProperty({
    example: '2026-11-20T00:00:00.000Z',
    description: 'Calendar date for this usage window (UTC midnight)',
  })
  date!: Date;

  @ApiProperty({ example: 3, description: 'Number of exchanges used today' })
  exchanges!: number;

  @ApiProperty({ example: 4500, description: 'Number of tokens used today' })
  tokensUsed!: number;

  @ApiProperty({
    type: QuotaDetailDto,
    description: 'Configured limits for user role',
  })
  limits!: QuotaDetailDto;

  @ApiProperty({
    type: QuotaRemainingDto,
    description: 'Remaining quota available today',
  })
  remaining!: QuotaRemainingDto;
}
