import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  Get,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import { FacebookAuthGuard } from 'src/common/guards/facebook-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ChangePasswordDto,
  ConfirmChangePasswordDto,
} from './dto/change-password.dto';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('auth')
@ActivityLog('Authentication & Account')
export class AuthController {
  constructor(private authService: AuthService) {}
  private getIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }

    return req.socket.remoteAddress || 'unknown';
  }
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/login?error=google_cancelled`,
      );
    }
    return this.authService.loginWithOAuthProvider(req.user as any, res, this.getIp(req));
  }
  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookLogin() {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  facebookCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/login?error=facebook_cancelled`,
      );
    }
    return this.authService.loginWithOAuthProvider(req.user as any, res, this.getIp(req));
  }
  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getIp(req));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.login(dto, res, this.getIp(req));
  }

  @Public()
  @Post('verify-login-otp')
  @HttpCode(200)
  verifyLoginOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.verifyLoginOtp(dto.email, dto.code, res, this.getIp(req));
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto, @Req() req: Request) {
    return this.authService.resendOtp(dto.email, dto.type, this.getIp(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req.cookies?.refresh_token, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req.cookies?.refresh_token, res, this.getIp(req));
  }

  @Public()
  @Get('profile')
  getMe(@Req() req: Request) {
    return this.authService.me(req.cookies?.access_token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto.email, this.getIp(req));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
  @Public()
  @Get('validate-reset-token')
  async validateResetToken(
    @Query('token') token: string,
  ) {
    return this.authService.validateResetToken(token);
  }
  @Patch('change-password')
  @HttpCode(200)
  @ActivityLog('Change password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @GetUser() user: any,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user.id, dto, this.getIp(req));
  }

  @Post('confirm-change-password')
  @HttpCode(200)
  @ActivityLog('Confirm change password')
  confirmChangePassword(
    @Body() body: ConfirmChangePasswordDto,
    @GetUser() user: any,
  ) {
    return this.authService.confirmChangePassword(user.id, body.code);
  }
}
