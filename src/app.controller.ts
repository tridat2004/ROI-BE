import { Controller, Get } from '@nestjs/common';
import { ActivityLog } from './common/decorators/activity-log.decorator';
import { AppService } from './app.service';

@Controller()
@ActivityLog('System')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
