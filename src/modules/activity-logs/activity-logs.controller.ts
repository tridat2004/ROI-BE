import { Controller, Get, Query, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
@ActivityLog('Activity Logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('View system activity logs')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('username') username?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    return await this.activityLogsService.findAll({
      page: pageNum,
      limit: limitNum,
      username,
      startDate,
      endDate
    });
  }

  @Get('user/:userId')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('View user activity logs')
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('action') action?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return await this.activityLogsService.findAll({
      page: pageNum, 
      limit: limitNum, 
      userId, 
      action
    });
  }
}
