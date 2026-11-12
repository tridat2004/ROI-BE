import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoiChartPointsService } from './roi-chart-points.service';
import { CreateRoiChartPointDto } from './dto/create-roi-chart-point.dto';
import { UpdateRoiChartPointDto } from './dto/update-roi-chart-point.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-chart-points')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Chart Point Management')
export class RoiChartPointsController {
  constructor(private readonly roiChartPointsService: RoiChartPointsService) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Create ROI chart point')
  create(@Body() createRoiChartPointDto: CreateRoiChartPointDto) {
    return this.roiChartPointsService.create(createRoiChartPointDto);
  }

  @Get()
  findAll() {
    return this.roiChartPointsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roiChartPointsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Update ROI chart point')
  update(
    @Param('id') id: string,
    @Body() updateRoiChartPointDto: UpdateRoiChartPointDto,
  ) {
    return this.roiChartPointsService.update(+id, updateRoiChartPointDto);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Delete ROI chart point')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.roiChartPointsService.softDelete(id, user);
  }
}
