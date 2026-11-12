import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Ip,
  Headers,
  Query,
} from '@nestjs/common';
import { RoiProjectsService } from './roi-projects.service';
import { CreateRoiProjectDto } from './dto/create-roi-project.dto';
import { UpdateRoiProjectDto } from './dto/update-roi-project.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('roi-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('ROI Project Management')
export class RoiProjectsController {
  constructor(private readonly roiProjectsService: RoiProjectsService) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER, AppRole.SALE)
  @ActivityLog('Create new ROI project')
  create(
    @Body() body: CreateRoiProjectDto,
    @GetUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.roiProjectsService.create(body, user.id, ip, userAgent);
  }

  @Get()
  @ActivityLog('View ROI projects list')
  findAll(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('projectName') projectName?: string,
    @Query('ownerName') ownerName?: string,
  ) {
    const pageNumber = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const limitNumber = limit ? Math.max(1, parseInt(limit, 10) || 10) : 10;
    return this.roiProjectsService.findAll(
      user,
      pageNumber,
      limitNumber,
      projectName,
      ownerName,
    );
  }

  @Get('dashboard')
  @ActivityLog('View Project Dashboard')
  getDashboard(@GetUser() user: User) {
    return this.roiProjectsService.getDashboard(user.id);
  }

  @Get(':id')
  @ActivityLog('View ROI project details')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.roiProjectsService.findOne(+id, user);
  }

  @Patch(':id')
  @ActivityLog('Update ROI project information')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoiProjectDto,
    @GetUser() user: User,
  ) {
    return this.roiProjectsService.update(+id, dto, user);
  }

  @Delete(':id')
  @ActivityLog('Delete ROI project')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.roiProjectsService.softDelete(+id, user);
  }
}
