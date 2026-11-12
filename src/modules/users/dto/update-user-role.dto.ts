import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
