import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Password (min 6 characters)',
  })

  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Full name' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    example: 'FPT Software',
    description: 'Company name',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Phone number',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, {message:'Do not enter more than 20 characters.'})
  phone?: string;
}