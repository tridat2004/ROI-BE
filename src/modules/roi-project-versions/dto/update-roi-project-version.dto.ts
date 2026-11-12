import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoiProjectVersionDto {
  @ApiProperty({
    example: 'Version 1',
    description: 'Title of the project version',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}
