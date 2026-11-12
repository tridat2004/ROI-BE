import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRolePermissionDto {
  @ApiProperty({
    example: 1,
    description: 'Role ID',
  })
  @IsNumber()
  @IsNotEmpty()
  roleId: number;

  @ApiProperty({
    example: 1,
    description: 'Permission ID',
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}
