import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoiScenariosService } from './roi-scenarios.service';
import { CreateRoiScenarioDto } from './dto/create-roi-scenario.dto';
import { UpdateRoiScenarioDto } from './dto/update-roi-scenario.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-scenarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Scenario Management')
export class RoiScenariosController {
  constructor(private readonly roiScenariosService: RoiScenariosService) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Create new ROI scenario')
  create(@Body() createRoiScenarioDto: CreateRoiScenarioDto) {
    return this.roiScenariosService.create(createRoiScenarioDto);
  }

  @Get()
  findAll() {
    return this.roiScenariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roiScenariosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Update ROI scenario information')
  update(
    @Param('id') id: string,
    @Body() updateRoiScenarioDto: UpdateRoiScenarioDto,
  ) {
    return this.roiScenariosService.update(+id, updateRoiScenarioDto);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Delete ROI scenario')
  remove(@Param('id') id: string) {
    return this.roiScenariosService.remove(+id);
  }
}
