import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ActivityLog('User Management')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Admin created new user')
  create(@Body() createUserDto: CreateUserDto, @GetUser() currentUser: any) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('roleId') roleId?: number,
  ) {
    return this.usersService.findAll(+page, +limit, search, roleId ? +roleId : undefined);
  }

  @Get('profile')
  findOneUser(@GetUser() user: any) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User information not found in request');
    }
    return this.usersService.findOneUser(+userId);
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Admin viewed user details')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.usersService.findOne(+id);
  }

  @Patch('profile')
  @ActivityLog('Update personal profile')
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @GetUser() user: User,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch(':id/role')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Update user roles/permissions')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @GetUser() currentUser: any,
  ) {
    return this.usersService.updateRole(+id, dto, currentUser);
  }

  @Patch('profileUser')
  @ActivityLog('Update user profile')
  updateProfileUser(
    @Body() dto: UpdateProfileDto,
    @GetUser() user: User,
  ) {
    return this.usersService.updateProfileUser(user.id, dto);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Delete user account')
  remove(@Param('id') id: string, @GetUser() currentUser: any) {
    return this.usersService.remove(+id, currentUser);
  }

  @Patch(':id/restore')
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ActivityLog('Restore user account')
  restoreUser(
    @Param('id') id: string,
    @GetUser() currentUser: any,
  ) {
    return this.usersService.restoreUser(+id, currentUser);
  }
}
