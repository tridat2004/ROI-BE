import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
            host: config.get('MAIL_SERVER'),    
            port: config.get<number>('MAIL_PORT'),
            secure: false,
            pool: true,           
            maxConnections: 20,      
            maxMessages: 500,
            socketTimeout: 30000,
            auth: {
              user: config.get('MAIL_USERNAME'),  
              pass: config.get('MAIL_PASSWORD'),  
            },
        },
        defaults: {
          from: `"AI ROI" <${config.get('MAIL_FROM') ?? config.get('MAIL_USERNAME')}>`,
        },
        }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

// import { Module } from '@nestjs/common';
// import { MailService } from './mail.service';

// @Module({
//   providers: [MailService],
//   exports: [MailService],
// })
// export class MailModule {}