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
import { RoiVersionScenariosService } from './roi-version-scenarios.service';
import { CreateRoiVersionScenarioDto } from './dto/create-roi-version-scenario.dto';
import { UpdateRoiVersionScenarioDto } from './dto/update-roi-version-scenario.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-version-scenarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Version Scenario Management')
export class RoiVersionScenariosController {
  constructor(
    private readonly roiVersionScenariosService: RoiVersionScenariosService,
  ) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Add scenario to project version')
  create(@Body() createRoiVersionScenarioDto: CreateRoiVersionScenarioDto) {
    return this.roiVersionScenariosService.create(createRoiVersionScenarioDto);
  }

  @Get()
  findAll() {
    return this.roiVersionScenariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roiVersionScenariosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Update project version scenario')
  update(
    @Param('id') id: string,
    @Body() updateRoiVersionScenarioDto: UpdateRoiVersionScenarioDto,
  ) {
    return this.roiVersionScenariosService.update(
      +id,
      updateRoiVersionScenarioDto,
    );
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Delete project version scenario')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.roiVersionScenariosService.softDelete(id, user);
  }
}
