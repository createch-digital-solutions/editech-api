import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TutorPersona {
  FRIENDLY = 'friendly',
  FORMAL = 'formal',
  SOCRATIC = 'socratic',
}

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  @IsEnum(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty()
  @IsString()
  content!: string;
}

export class TutorChatDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ enum: TutorPersona, default: TutorPersona.FRIENDLY })
  @IsOptional()
  @IsEnum(TutorPersona)
  persona: TutorPersona = TutorPersona.FRIENDLY;
}
