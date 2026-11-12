import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectQueue } from '@nestjs/bull';
import type { Cache } from 'cache-manager';
import type { Queue } from 'bull';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { OtpService } from 'src/common/otp/otp.service';
import { MailService } from 'src/common/mail/mail.service';
import {
  InvalidCredentials,
  InvalidRefreshToken,
  EmailAlreadyExists,
  UserNotActive,
  Unauthorized,
  UserNotFound,
  EmailNotFound,
} from '../../common/exception';
import { successResponse } from '../../common/response';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AppRole } from '../../common/decorators/roles.decorator';

const COOKIE_OPTIONS = (configService: ConfigService, maxAge: number) => ({
  httpOnly: true,
  secure: configService.get('NODE_ENV') === 'production',
  sameSite: 'lax' as const,
  maxAge,
});

const OTP_REQUIRED_ROLES = new Set<number>([AppRole.ADMIN, AppRole.MANAGER]);
const FORGOT_PW_LIMIT = 3;
const FORGOT_PW_WINDOW = 60 * 60 * 1000;
const CHANGE_PW_LIMIT = 5;
const CHANGE_PW_WINDOW = 24 * 60 * 60 * 1000;
const LOGIN_FAIL_LIMIT = 5;
const LOGIN_LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RESET_PASSWORD_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
export interface OAuthUser {
  email: string;
  fullName: string;
  provider: 'google' | 'facebook';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @Inject(CACHE_MANAGER)
    private cache: Cache,

    @Inject('REDIS')
    private redis: Redis,

    @InjectQueue('otp')
    private otpQueue: Queue,

    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private mailService: MailService,
    private activityLogsService: ActivityLogsService,
  ) {}

  private getLoginStateKey(email: string) {
    return `login-state:${email}`;
  }

  private formatRemainingTime(lockedAt: number): string {
    const remainingMs = LOGIN_LOCKOUT_WINDOW - (Date.now() - lockedAt);
    const remainingMin = Math.ceil(remainingMs / 60000);
    const remainingSec = Math.ceil(remainingMs / 1000);
    return remainingMin >= 1
      ? `${remainingMin} minute${remainingMin > 1 ? 's' : ''}`
      : `${remainingSec} second${remainingSec > 1 ? 's' : ''}`;
  }

  private async checkLoginLockout(email: string) {
    const state = await this.cache.get<{ fails: number; lockedAt?: number }>(
      this.getLoginStateKey(email),
    );
    if (state && state.fails >= LOGIN_FAIL_LIMIT && state.lockedAt) {
      const timeMsg = this.formatRemainingTime(state.lockedAt);
      throw new BadRequestException(
        `Too many failed login attempts. Please try again in ${timeMsg}`,
      );
    }
  }

  private async recordLoginFailure(email: string) {
    const key = this.getLoginStateKey(email);
    const state = (await this.cache.get<{ fails: number; lockedAt?: number }>(
      key,
    )) ?? { fails: 0 };
    const newFails = state.fails + 1;
    const isNowLocked = newFails >= LOGIN_FAIL_LIMIT;
    await this.cache.set(
      key,
      {
        fails: newFails,
        lockedAt: isNowLocked ? (state.lockedAt ?? Date.now()) : undefined,
      },
      LOGIN_LOCKOUT_WINDOW,
    );
  }

  private async clearLoginFailures(email: string) {
    await this.cache.del(this.getLoginStateKey(email));
  }

  private async getPrimaryRoleId(userId: number): Promise<number | null> {
    const userRole = await this.userRoleRepo.findOne({
      where: { userId },
      select: { userId: true, roleId: true },
      order: { roleId: 'ASC' },
    });

    return userRole?.roleId ?? null;
  }

  private signAccessToken(payload: object) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  private signRefreshToken(payload: object) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }
  private async checkEmailRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    errorMessage: string,
  ) {
    const current = (await this.cache.get<number>(key)) ?? 0;
    if (current >= limit) {
      throw new BadRequestException(errorMessage);
    }
    await this.cache.set(key, current + 1, windowMs);
  }
  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(
      'access_token',
      accessToken,
      COOKIE_OPTIONS(this.configService, 15 * 60 * 1000),
    );
    res.cookie(
      'refresh_token',
      refreshToken,
      COOKIE_OPTIONS(this.configService, 7 * 24 * 60 * 60 * 1000),
    );
  }

  private async saveRefreshToken(userId: number, token: string) {
    await this.refreshTokenRepo.insert({
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    });
  }

  private async issueTokens(
    user: User,
    roleId: number | null,
    res: Response,
    ip?: string,
  ) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.saveRefreshToken(user.id, refreshToken);
    this.setCookies(res, accessToken, refreshToken);

    await this.activityLogsService.create({
      userId: user.id,
      username: user.fullName || user.email,
      action: 'LOGIN',
      status: 'SUCCESS',
      ip: ip,
      desc: `User logged in: ${user.fullName || user.email}`,
    });

    return successResponse({
      message: 'Login successful',
      data: { id: user.id, email: user.email, fullName: user.fullName, roleId },
    });
  }

  private async sendOtpOrThrow(
    email: string,
    type: 'register' | 'login' | 'forgot_password',
    ip: string,
    skipIpRateLimit = false,
  ) {
    if (!skipIpRateLimit) {
      await this.otpService.checkIpRateLimit(ip);
    }

    const { code, remainingLockSeconds } = await this.otpService.generateOtp(
      email,
      type,
    );
    if (!code) {
      throw new BadRequestException(
        `Please wait ${remainingLockSeconds}s before requesting a new OTP`,
      );
    }

    // Queue OTP email for async processing with retries
    await this.otpQueue.add(
      'send',
      { email, code, type },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
  private generateSecurePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$%&*!';
    const allChars = upper + lower + digits + special;
    const required = [
      upper[crypto.randomInt(upper.length)],
      upper[crypto.randomInt(upper.length)],
      lower[crypto.randomInt(lower.length)],
      lower[crypto.randomInt(lower.length)],
      digits[crypto.randomInt(digits.length)],
      digits[crypto.randomInt(digits.length)],
      special[crypto.randomInt(special.length)],
      special[crypto.randomInt(special.length)],
    ];
    return required.sort(() => crypto.randomInt(3) - 1).join('');
  }

  async loginWithOAuthProvider(
    oauthUser: OAuthUser,
    res: Response,
    ip?: string,
  ) {
    const feUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    let user = await this.userRepo.findOne({
      where: { email: oauthUser.email },
      select: { id: true, email: true, status: true, fullName: true },
    });
    let roleId: number | null = null;

    if (!user) {
      const newUser = this.userRepo.create({
        email: oauthUser.email,
        fullName: oauthUser.fullName,
        passwordHash: null,
        status: 'active',
        provider: oauthUser.provider,
      });
      user = await this.userRepo.save(newUser);
      await this.userRoleRepo.insert({ userId: user.id, roleId: 3 });
      roleId = 3;

      await this.activityLogsService.create({
        userId: user.id,
        username: user.fullName || user.email,
        action: 'REGISTER',
        status: 'SUCCESS',
        ip: ip,
        desc: `User registered via ${oauthUser.provider}: ${user.fullName || user.email}`,
      });
    }

    if (user.status !== 'active') {
      return res.redirect(`${feUrl}/auth/error?reason=inactive`);
    }

    roleId ??= await this.getPrimaryRoleId(user.id);

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.saveRefreshToken(user.id, refreshToken);
    this.setCookies(res, accessToken, refreshToken);

    await this.activityLogsService.create({
      userId: user.id,
      username: user.fullName || user.email,
      action: 'LOGIN',
      status: 'SUCCESS',
      ip: ip,
      desc: `User logged in via ${oauthUser.provider}: ${user.fullName || user.email}`,
    });

    return res.redirect(
      `${feUrl}/dashboard?id=${user.id}&email=${encodeURIComponent(user.email)}&roleId=${roleId}`,
    );
  }

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ip?: string) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) throw new EmailAlreadyExists();
    const rawPassword = this.generateSecurePassword();

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const newUser = this.userRepo.create({
      email: dto.email,
      fullName: dto.fullName ?? undefined,
      companyName: dto.companyName ?? undefined,
      phone: dto.phone ?? null,
      passwordHash,
      status: 'active',
      provider: 'local',
    });

    const user = await this.userRepo.save(newUser);
    await this.userRoleRepo.insert({ userId: user.id, roleId: 3 });

    this.mailService.sendWelcomeWithPassword(
      dto.email,
      dto.fullName ?? '',
      rawPassword,
    );

    await this.activityLogsService.create({
      userId: user.id,
      username: user.fullName || user.email,
      action: 'REGISTER',
      status: 'SUCCESS',
      ip: ip,
      desc: `User registered: ${user.fullName || user.email}`,
    });

    return successResponse({
      message: 'Registration successful. Password has been sent to your email.',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: 3,
      },
    });
  }

  async login(dto: LoginDto, res: Response, ip: string) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.passwordHash) throw new InvalidCredentials();
    if (!user.isActive) throw new UserNotActive();

    await this.checkLoginLockout(dto.email);

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.recordLoginFailure(dto.email);
      const state = await this.cache.get<{ fails: number; lockedAt?: number }>(
        this.getLoginStateKey(dto.email),
      );
      const fails = state?.fails ?? 0;
      const remaining = LOGIN_FAIL_LIMIT - fails;
      if (remaining <= 0 && state?.lockedAt) {
        const timeMsg = this.formatRemainingTime(state.lockedAt);
        throw new BadRequestException(
          `Too many failed login attempts. Please try again in ${timeMsg}`,
        );
      }
      throw new BadRequestException(
        `Invalid credentials. ${remaining} attempt(s) remaining before account is temporarily locked`,
      );
    }

    await this.clearLoginFailures(dto.email);

    const roleId = await this.getPrimaryRoleId(user.id);
    if (roleId !== null && OTP_REQUIRED_ROLES.has(roleId)) {
      await this.sendOtpOrThrow(user.email, 'login', ip);
      return successResponse({
        message: 'OTP sent to your email',
        data: { email: user.email, requiresOtp: true },
      });
    }

    return this.issueTokens(user, roleId, res, ip);
  }

  async verifyLoginOtp(
    email: string,
    code: string,
    res: Response,
    ip?: string,
  ) {
    const isValid = await this.otpService.verifyOtp(email, 'login', code);
    if (!isValid) {
      const remaining = await this.otpService.getRemainingAttempts(
        email,
        'login',
      );
      throw new BadRequestException(
        remaining > 0
          ? `Invalid OTP, ${remaining} attempt(s) remaining`
          : 'Invalid or expired OTP',
      );
    }

    const user = await this.userRepo.findOne({
      where: { email },
      select: { id: true, email: true, fullName: true, status: true },
    });
    if (!user) throw new UserNotFound();
    if (user.status !== 'active') throw new UserNotActive();

    const roleId = await this.getPrimaryRoleId(user.id);

    if (roleId === null || !OTP_REQUIRED_ROLES.has(roleId)) {
      throw new BadRequestException(
        'OTP login is not required for this account',
      );
    }

    return this.issueTokens(user, roleId, res, ip);
  }

  // ─── Resend OTP ────────────────────────────────────────────────────────────

  async resendOtp(email: string, type: 'register' | 'login', ip: string) {
    if (type === 'register') {
      const alreadyVerified = await this.cache.get(`registered:${email}`);
      if (alreadyVerified)
        throw new BadRequestException('Email already verified, please login');

      const existingUser = await this.userRepo.findOne({ where: { email } });
      if (existingUser)
        throw new BadRequestException('Email already verified, please login');

      const hasPending = await this.cache.get(`pending:register:${email}`);
      if (!hasPending)
        throw new BadRequestException(
          'No pending registration, please register first',
        );
    }

    if (type === 'login') {
      const user = await this.userRepo.findOne({
        where: { email },
        select: { id: true, email: true, status: true },
      });
      if (!user) throw new BadRequestException('Email not found');
      if (user.status !== 'active') throw new UserNotActive();

      const roleId = await this.getPrimaryRoleId(user.id);
      if (roleId === null || !OTP_REQUIRED_ROLES.has(roleId)) {
        throw new BadRequestException(
          'OTP login is not required for this account',
        );
      }
    }

    await this.sendOtpOrThrow(email, type, ip);
    return successResponse({ message: 'OTP resent', data: null });
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) throw new InvalidRefreshToken();

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new InvalidRefreshToken();
    }

    const stored = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, isRevoked: false },
      select: { id: true, expiresAt: true },
    });
    if (!stored || stored.expiresAt < new Date())
      throw new InvalidRefreshToken();

    await this.refreshTokenRepo.update(stored.id, { isRevoked: true });

    const newPayload = { sub: payload.sub, email: payload.email };
    const newAccessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    await this.saveRefreshToken(payload.sub, newRefreshToken);
    this.setCookies(res, newAccessToken, newRefreshToken);

    return successResponse({ message: 'Token refreshed', data: null });
  }

  async logout(refreshToken: string, res: Response, ip?: string) {
    if (refreshToken) {
      const stored = await this.refreshTokenRepo.findOne({
        where: { token: refreshToken },
      });
      if (stored) {
        await this.refreshTokenRepo.update(
          { token: refreshToken },
          { isRevoked: true },
        );
        const user = await this.userRepo.findOne({
          where: { id: stored.userId },
        });
        if (user) {
          await this.activityLogsService.create({
            userId: user.id,
            username: user.fullName || user.email,
            action: 'LOGOUT',
            status: 'SUCCESS',
            ip: ip,
            desc: `User logged out: ${user.fullName || user.email}`,
          });
        }
      }
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return successResponse({ message: 'Logged out', data: null });
  }

  async me(accessToken: string) {
    if (!accessToken) throw new Unauthorized();

    let payload: any;
    try {
      payload = this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new Unauthorized();
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true, status: true },
    });
    if (!user) throw new UserNotFound();
    if (user.status !== 'active') throw new UserNotActive();

    const roleId = await this.getPrimaryRoleId(user.id);
    return successResponse({
      message: 'Get profile successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        roleId,
      },
    });
  }

  async forgotPassword(email: string, ip: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
        passwordHash: true,
        provider: true,
      },
    });
    if (!user) throw new EmailNotFound();
    await this.checkEmailRateLimit(
      `forgot-pw-limit:${email}`,
      FORGOT_PW_LIMIT,
      FORGOT_PW_WINDOW,
      'Too many reset requests. Please try again after 1 hour',
    );

    await this.otpService.checkIpRateLimit(ip);

    if (user && user.status === 'active' && user.passwordHash) {
      const token = crypto.randomBytes(32).toString('hex');
      await this.redis.set(
        `reset-token:${token}`,
        email,
        'EX',
        RESET_PASSWORD_TOKEN_TTL,
      );

      const feUrl =
        this.configService.get<string>('FRONTEND_URL') ??
        'http://localhost:5173';
      const link = `${feUrl}/reset-password?token=${token}`;
      const expiresInLabel = '15 minutes';

      this.mailService
        .sendResetPasswordLink(email, link, expiresInLabel)
        .catch((err) => {
          console.error('[RESET] Mail failed:', err.message);
        });
    }

    return successResponse({
      message: 'If the account exists, we have sent a reset link to your email',
      data: null,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const email = await this.redis.get(`reset-token:${token}`);
    if (!email)
      throw new BadRequestException('Reset link is invalid or expired');

    const user = await this.userRepo.findOne({
      where: { email },
      select: { id: true, email: true, passwordHash: true, provider: true },
    });
    if (!user) throw new UserNotFound();

    if (!user.passwordHash) {
      throw new BadRequestException(
        `This account uses ${user.provider ?? 'social'} login. Password change is not available.`,
      );
    }

    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, { passwordHash });

    await this.redis.del(`reset-token:${token}`);

    return successResponse({
      message: 'Password reset successfully',
      data: null,
    });
  }

  async validateResetToken(token: string) {
    const email = await this.redis.get(`reset-token:${token}`);
    if (!email) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    return successResponse({
      message: 'Reset token is valid',
      data: { email },
    });
  }

  async changePassword(userId: number, dto: ChangePasswordDto, ip: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        passwordHash: true,
        provider: true,
      },
    });
    if (!user) throw new UserNotFound();
    if (user.status !== 'active') throw new UserNotActive();

    if (!user.passwordHash) {
      throw new BadRequestException(
        `This account uses ${user.provider ?? 'social'} login. Password change is not available.`,
      );
    }

    await this.checkEmailRateLimit(
      `change-pw-limit:${userId}`,
      CHANGE_PW_LIMIT,
      CHANGE_PW_WINDOW,
      'Too many password change attempts. Please try again after 24 hours',
    );

    await this.otpService.checkIpRateLimit(ip);

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch)
      throw new BadRequestException('Current password is incorrect');

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.cache.set(
      `pending-change-pw:${user.email}`,
      newPasswordHash,
      10 * 60 * 1000,
    );

    await this.sendOtpOrThrow(user.email, 'forgot_password', ip, true);

    return successResponse({
      message: 'OTP sent to your email to confirm password change',
      data: { email: user.email },
    });
  }

  async confirmChangePassword(userId: number, code: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new UserNotFound();

    const isValid = await this.otpService.verifyOtp(
      user.email,
      'forgot_password',
      code,
    );
    if (!isValid) {
      const remaining = await this.otpService.getRemainingAttempts(
        user.email,
        'forgot_password',
      );
      throw new BadRequestException(
        remaining > 0
          ? `Invalid OTP, ${remaining} attempt(s) remaining`
          : 'Invalid or expired OTP',
      );
    }

    const newPasswordHash = await this.cache.get<string>(
      `pending-change-pw:${user.email}`,
    );
    if (!newPasswordHash)
      throw new BadRequestException('Session expired, please start over');

    await this.userRepo.update(userId, { passwordHash: newPasswordHash });
    await Promise.all([
      this.cache.del(`pending-change-pw:${user.email}`),
      this.refreshTokenRepo.update(
        { userId, isRevoked: false },
        { isRevoked: true },
      ),
    ]);

    return successResponse({
      message: 'Password changed successfully. Please login again.',
      data: null,
    });
  }
}
