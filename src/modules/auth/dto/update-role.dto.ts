import { IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ description: 'Target user ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: Role, description: 'New role to assign' })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
