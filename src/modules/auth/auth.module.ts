import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../common/guards/jwt.strategy';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

import { OtpModule } from 'src/common/otp/otp.module';
import { MailModule } from 'src/common/mail/mail.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, UserRole, Role]),
    PassportModule,
    JwtModule.register({}),
    MailModule,
    OtpModule,
    CacheModule.register({}),
    ActivityLogsModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}