import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    type: 'string', example: 'test@gmai.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'string', example: '123456'
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code: string;
}