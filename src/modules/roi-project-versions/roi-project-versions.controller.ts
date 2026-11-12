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
  Query,
} from '@nestjs/common';
import { RoiProjectVersionsService } from './roi-project-versions.service';
import { CreateRoiProjectVersionDto } from './dto/create-roi-project-version.dto';
import { UpdateRoiProjectVersionDto } from './dto/update-roi-project-version.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';

@Controller('roi-project-versions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Project Version Management')
export class RoiProjectVersionsController {
  constructor(
    private readonly roiProjectVersionsService: RoiProjectVersionsService,
  ) { }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Create new ROI project version')
  create(
    @Body() dto: CreateRoiProjectVersionDto,
    @GetUser() user: User,
  ) {
    return this.roiProjectVersionsService.create(
      dto,
      user,
    );
  }

  @Get('project/:projectId')
  @ActivityLog('View project versions list')
  findAll(
    @GetUser() user: User,
    @Param('projectId', ParseIntPipe) projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const limitNumber = limit ? Math.max(1, parseInt(limit, 10) || 10) : 10;
    return this.roiProjectVersionsService.findAll(
      +projectId,
      pageNumber,
      limitNumber,
      user,
    );
  }

  @Get(':id')
  @ActivityLog('View ROI project version details')
  findOne(@Param('id', ParseIntPipe) id: string, @GetUser() user: User) {
    return this.roiProjectVersionsService.findOne(+id, user);
  }

  @Patch(':id')
  @ActivityLog('Update ROI project version content')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateRoiProjectVersionDto,
    @GetUser() user: User,
  ) {
    return this.roiProjectVersionsService.update(
      +id,
      dto,
      user,
    );
  }


  @Delete(':id')
  @ActivityLog('Delete ROI project version')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.roiProjectVersionsService.softDeleteVersion(id, user);
  }
}
