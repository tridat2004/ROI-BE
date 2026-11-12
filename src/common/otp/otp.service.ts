import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';
const OTP_TTL = 300; // seconds
const LOCK_TTL = 120;
const MAX_ATTEMPTS = 5;
const IP_LIMIT = 20;
const IP_WINDOW = 300;

interface OtpData {
  hash: string;
  attempts: number;
  expiresAt: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(@Inject('REDIS') private redis: Redis) {}

  private keyOtp(email: string, type: string) {
    return `otp:${type}:${email}`;
  }

  private keyLock(email: string, type: string) {
    return `otp:lock:${type}:${email}`;
  }

  private keyIp(ip: string) {
    return `otp:ip:${ip}`;
  }
  private hashcode(code: string) {
    return crypto
      .createHash('sha256')
      .update(code + process.env.OTP_SECRET)
      .digest('hex');
  }
  private generateCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
  async checkIpRateLimit(ip: string): Promise<void> {
    const key = this.keyIp(ip);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, IP_WINDOW);
    }

    if (count > IP_LIMIT) {
      throw new BadRequestException('Too many OTP requests');
    }
  }
  async generateOtp(email: string, type: string) {
    const lockKey = this.keyLock(email, type);
    const otpKey = this.keyOtp(email, type);

    const isLocked = await this.redis.get(lockKey);
    if (isLocked) {
      const ttl = await this.redis.ttl(lockKey);
      return { code: null, remainingLockSeconds: ttl };
    }
    const code = this.generateCode();

    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(
        `[DEV OTP] email=${email} type=${type} code=${code} expiresIn=${OTP_TTL}s`,
      );
    } else {
      this.logger.log(`OTP generated for ${email} (${type})`);
    }

    const data = JSON.stringify({
      hash: this.hashcode(code),
      attempts: 0,
    });

    await this.redis
      .multi()
      .set(otpKey, data, 'EX', OTP_TTL)
      .set(lockKey, '1', 'EX', LOCK_TTL)
      .exec();
    return { code, remainingLockSeconds: null };
  }

  async verifyOtp(email: string, type: string, code: string) {
    const otpKey = this.keyOtp(email, type);
    const raw = await this.redis.get(otpKey);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (this.hashcode(code) !== data.hash) {
      data.attempts += 1;

      if (data.attempts >= MAX_ATTEMPTS) {
        await this.redis.del(otpKey);
        throw new BadRequestException('Too many attempts');
      }

      await this.redis.set(otpKey, JSON.stringify(data), 'KEEPTTL');
      return false;
    }
    const inputHash = this.hashcode(code);
    await this.redis.del(otpKey);
    await this.redis.del(this.keyLock(email, type));

    return true;
  }

  async getLockRemaining(email: string, type: string): Promise<number> {
    const lockData = await this.redis.get(this.keyLock(email, type));
    if (!lockData) return 0;
    const remaining = Math.ceil((parseInt(lockData, 10) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }
  async getRemainingAttempts(email: string, type: string): Promise<number> {
    const raw = await this.redis.get(this.keyOtp(email, type));
    if (!raw) return 0;
    const otpData: OtpData = JSON.parse(raw);
    return MAX_ATTEMPTS - otpData.attempts;
  }
}
