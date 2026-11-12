import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { OtpProcessor } from './otp.processor';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    MailModule,
    BullModule.registerQueueAsync({
      name: 'otp',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const password = configService.get<string>('REDIS_PASSWORD');
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            db: configService.get<number>('REDIS_DB') ?? 0,
            ...(password && { password }),  // Add password only if it exists
          },
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        };
      },
    }),
  ],
  providers: [OtpService, OtpProcessor],
  exports: [OtpService, BullModule],
})
export class OtpModule {}