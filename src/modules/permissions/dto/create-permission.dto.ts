import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission code',
    example: 'user:create',
  })
  @MaxLength(50)
  @MinLength(3)
  @IsString()
  code: string;
}
