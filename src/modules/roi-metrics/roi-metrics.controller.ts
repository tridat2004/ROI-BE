import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoiMetricsService } from './roi-metrics.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { RecalculateRoiDto } from './dto/recalculate-roi.dto';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Metrics Management')
export class RoiMetricsController {
  constructor(private readonly roiMetricsService: RoiMetricsService) { }

  @Post('calculate/:versionId')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @HttpCode(200)
  @ActivityLog('Calculate ROI metrics')
  calculate(
    @Param('versionId', ParseIntPipe) versionId: number,
    @GetUser() user: any,
  ) {
    return this.roiMetricsService.calculate(versionId, user);
  }

  @Get('summary/base-scenario')
  @ActivityLog('View ROI summary report')
  getProjectMetricsSummary(
    @GetUser() user: any,
    @Query('sortBy') sortBy?: 'annualSaving' | 'paybackMonths',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('scenarioId') scenarioId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('projectName') projectName?: string,
    @Query('ownerName') ownerName?: string,
  ) {
    return this.roiMetricsService.getProjectMetricsSummary(
      user,
      sortBy,
      sortOrder,
      scenarioId ? +scenarioId : undefined,
      limit ? +limit : 10,
      page ? +page : 1,
      projectName,
      ownerName,
    );
  }

  @Get(':versionId')
  @ActivityLog('View ROI calculation results by version')
  findAll(
    @Param('versionId', ParseIntPipe) versionId: number,
    @GetUser() user: any,
  ) {
    return this.roiMetricsService.findByVersion(versionId, user);
  }

  @Get(':versionId1/:versionId2')
  @ActivityLog('Compare ROI versions')
  compareVersions(
    @Param('versionId1', ParseIntPipe) versionId1: number,
    @Param('versionId2', ParseIntPipe) versionId2: number,
    @GetUser() user: any,
  ) {
    return this.roiMetricsService.compareVersions(versionId1, versionId2, user);
  }

  @Post('recalculate')
  @HttpCode(200)
  @ActivityLog('Recalculate ROI metrics')
  recalculate(@Body() dto: RecalculateRoiDto, @GetUser() user: any) {
    return this.roiMetricsService.recalculate(dto.versionId, dto, user);
  }

  @Delete(':id')
  @ActivityLog('Delete ROI metric')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.roiMetricsService.softDelete(id, user);
  }
}
