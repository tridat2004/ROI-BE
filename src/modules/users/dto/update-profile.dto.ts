import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full Name',
    example: 'John Doe',
    required: true,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Company Name',
    example: 'ABC Company',
    required: false,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'Phone',
    example: '0123456789',
    required: false,
  })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'phone must contain only numbers' })
  phone?: string;
}