import { Process, Processor } from '@nestjs/bull';
import bull from 'bull';
import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

type OtpJobData = {
  email: string;
  code: string;
  type: 'register' | 'login' | 'forgot_password';
};

@Processor('otp')
export class OtpProcessor {
  private readonly logger = new Logger(OtpProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send')
  async handleSendOtp(job: bull.Job<OtpJobData>) {
    const { email, code, type } = job.data;

    this.logger.log(`Sending OTP email to ${email} for ${type}`);

    await this.mailService.sendOtp(email, code, type);
  }
}