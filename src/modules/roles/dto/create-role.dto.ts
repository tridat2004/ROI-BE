import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
export class CreateRoleDto {
  @ApiProperty({ example: 'admin', description: 'Unique code for the role' })
  @IsString()
  code: string;

  @ApiProperty({
    example: 'Administrator',
    description: 'Display name for the role',
  })
  @IsString()
  @MinLength(1)
  name: string;
}
