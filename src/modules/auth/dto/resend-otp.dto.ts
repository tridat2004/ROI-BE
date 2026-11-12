import { IsEmail, IsIn } from 'class-validator';

export class ResendOtpDto {
  @IsEmail()
  email: string;

  @IsIn(['register', 'login'], { message: 'type must be register or login' })
  type: 'register' | 'login';
}