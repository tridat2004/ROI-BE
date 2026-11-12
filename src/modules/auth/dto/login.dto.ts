import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
