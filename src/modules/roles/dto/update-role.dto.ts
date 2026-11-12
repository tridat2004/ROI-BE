import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
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
