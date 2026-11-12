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
import { RolePermissionsService } from './role-permissions.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('role-permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
@ActivityLog('Role Permission Management')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) { }

  @Post()
  @HttpCode(200)
  @ActivityLog('Assign permission to role')
  assign(@Body() dto: CreateRolePermissionDto) {
    return this.rolePermissionsService.assign(dto.roleId, dto.permissionId);
  }

  @Delete()
  @ActivityLog('Revoke permission from role')
  revoke(@Body() dto: CreateRolePermissionDto) {
    return this.rolePermissionsService.revoke(dto.roleId, dto.permissionId);
  }

  @Get(':roleId')
  findByRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolePermissionsService.findByRole(roleId);
  }
}
