import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Permission code',
    example: 'user:create',
  })
  @MaxLength(50)
  @MinLength(3)
  @IsString()
  code: string;
}
