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
  Ip,
  Headers,
} from '@nestjs/common';
import { RoiFieldValuesService } from './roi-field-values.service';
import { CreateRoiFieldValueDto } from './dto/create-roi-field-value.dto';
import { UpdateRoiFieldValueDto } from './dto/update-roi-field-value.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';

@Controller('roi-field-values')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Field Value Management')
export class RoiFieldValuesController {
  constructor(private readonly roiFieldValuesService: RoiFieldValuesService) { }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Save ROI input values')
  create(
    @GetUser() user: User,
    @Body() dto: CreateRoiFieldValueDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.roiFieldValuesService.create(dto, user, ip, userAgent);
  }

  @Post('new-version')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Create new version from current inputs')
  createNewVersion(
    @GetUser() user: any,
    @Body() dto: CreateRoiFieldValueDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.roiFieldValuesService.createNewVersion(user, dto, ip, userAgent);
  }

  @Get()
  findAll(@GetUser() user: any) {
    return this.roiFieldValuesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.roiFieldValuesService.findOne(+id, user);
  }

  @Get('version/:versionId')
  @ActivityLog('View ROI project version input data')
  findOneVersion(@Param('versionId') versionId: string, @GetUser() user: any) {
    return this.roiFieldValuesService.findOneVersion(+versionId, user);
  }

  @Patch(':id')
  @ActivityLog('Update ROI input values')
  update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() dto: UpdateRoiFieldValueDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.roiFieldValuesService.update(+id, dto, user, ip, userAgent);
  }

  @Delete(':id')
  @ActivityLog('Delete ROI input values')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.roiFieldValuesService.softDelete(id, user, ip, userAgent);
  }
}
