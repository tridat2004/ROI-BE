import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoiFieldDefinitionsService } from './roi-field-definitions.service';
import { CreateRoiFieldDefinitionDto } from './dto/create-roi-field-definition.dto';
import { UpdateRoiFieldDefinitionDto } from './dto/update-roi-field-definition.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-field-definitions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Field Definition Management')
export class RoiFieldDefinitionsController {
  constructor(
    private readonly roiFieldDefinitionsService: RoiFieldDefinitionsService,
  ) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Create new ROI field definition')
  create(@Body() dto: CreateRoiFieldDefinitionDto) {
    return this.roiFieldDefinitionsService.create(dto);
  }

  @Get()
  @ActivityLog('View ROI field definitions list')
  findAll() {
    return this.roiFieldDefinitionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roiFieldDefinitionsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Update ROI field definition')
  update(@Param('id') id: string, @Body() dto: UpdateRoiFieldDefinitionDto) {
    return this.roiFieldDefinitionsService.update(+id, dto);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Delete ROI field definition')
  remove(@Param('id') id: string) {
    return this.roiFieldDefinitionsService.remove(+id);
  }
}
