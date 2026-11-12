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
import { RoiCashflowsService } from './roi-cashflows.service';
import { CreateRoiCashflowDto } from './dto/create-roi-cashflow.dto';
import { UpdateRoiCashflowDto } from './dto/update-roi-cashflow.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-cashflows')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Cashflow Management')
export class RoiCashflowsController {
  constructor(private readonly roiCashflowsService: RoiCashflowsService) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Create ROI cashflow for version')
  create(@Body() createRoiCashflowDto: CreateRoiCashflowDto) {
    return this.roiCashflowsService.create(createRoiCashflowDto);
  }

  @Get()
  findAll() {
    return this.roiCashflowsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roiCashflowsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Update ROI cashflow')
  update(
    @Param('id') id: string,
    @Body() updateRoiCashflowDto: UpdateRoiCashflowDto,
  ) {
    return this.roiCashflowsService.update(+id, updateRoiCashflowDto);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Delete ROI cashflow')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.roiCashflowsService.softDelete(id, user);
  }
}
