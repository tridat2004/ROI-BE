import { Injectable } from '@nestjs/common';
import { RolePermission } from './entities/role-permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { AppException } from 'src/common/exception';
import { successResponse } from 'src/common/response';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private rpRepo: Repository<RolePermission>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permRepo: Repository<Permission>,
  ) {}

  async assign(roleId: number, permissionId: number) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new AppException('Role not found', 'ROLE_NOT_FOUND', 404);

    const perm = await this.permRepo.findOne({ where: { id: permissionId } });
    if (!perm)
      throw new AppException(
        'Permission not found',
        'PERMISSION_NOT_FOUND',
        404,
      );

    const existing = await this.rpRepo.findOne({
      where: { roleId, permissionId },
    });
    if (existing)
      throw new AppException('Already assigned', 'ALREADY_ASSIGNED', 400);

    await this.rpRepo.save(this.rpRepo.create({ roleId, permissionId }));
    return successResponse({
      message: 'Permission assigned to role',
      data: null,
    });
  }

  async revoke(roleId: number, permissionId: number) {
    await this.rpRepo.delete({ roleId, permissionId });
    return successResponse({
      message: 'Permission revoked from role',
      data: null,
    });
  }

  async findByRole(roleId: number) {
    const rows = await this.rpRepo.find({
      where: { roleId },
      relations: ['permission'],
    });
    return successResponse({
      message: 'Get role permissions successfully',
      data: rows.map((r) => r.permission),
    });
  }
}
