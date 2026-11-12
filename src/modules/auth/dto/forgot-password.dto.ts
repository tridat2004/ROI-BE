// dto/forgot-password.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
      example: 'example@gmail.com',
      description: 'email',
    })
  @IsEmail()
  email: string;
}