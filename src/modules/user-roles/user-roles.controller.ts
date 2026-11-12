import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { UserRolesService } from './user-roles.service';
import { Permissions } from 'src/common/decorators/permissions.decorator';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('user-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
@ActivityLog('User Role Management')
export class UserRolesController {
  constructor(private userRolesService: UserRolesService) {}

  @Post()
  @HttpCode(200)
  @ActivityLog('Assign role to user')
  assign(@Body() dto: { userId: number; roleId: number }) {
    return this.userRolesService.assign(dto.userId, dto.roleId);
  }

  @Delete()
  @ActivityLog('Revoke user role')
  revoke(@Body() dto: { userId: number; roleId: number }) {
    return this.userRolesService.revoke(dto.userId, dto.roleId);
  }

  @Get(':userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userRolesService.findByUser(userId);
  }
}
