import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProvisionUserDto {
  @ApiProperty({
    description: 'Clerk User ID (user_*)',
    example: 'user_2bXYZ123abc456',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^user_[a-zA-Z0-9]+$/, {
    message: 'clerkId must be a valid Clerk user ID starting with user_',
  })
  clerkId: string;
}
