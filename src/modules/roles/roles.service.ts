// src/modules/roles/roles.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleAlreadyExists, RoleNotFound } from '../../common/exception';
import { successResponse } from '../../common/response';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.roleRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new RoleAlreadyExists();

    const role = this.roleRepo.create({ code: dto.code, name: dto.name });
    await this.roleRepo.save(role);

    return successResponse({
      message: 'Role created successfully',
      data: role,
    });
  }

  async findAll() {
    const roles = await this.roleRepo.find();
    return successResponse({
      message: 'Get roles successfully',
      data: roles,
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new RoleNotFound();
    return successResponse({
      message: 'Get role successfully',
      data: role,
    });
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new RoleNotFound();

    Object.assign(role, dto);
    await this.roleRepo.save(role);

    return successResponse({
      message: 'Role updated successfully',
      data: role,
    });
  }

  async delete(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new RoleNotFound();
    await this.roleRepo.delete(id);
    return successResponse({
      message: 'Role deleted successfully',
      data: null,
    });
  }
}
