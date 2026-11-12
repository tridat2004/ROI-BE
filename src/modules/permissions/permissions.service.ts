import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Not, Repository } from 'typeorm';
import { AppException } from 'src/common/exception';
import { successResponse } from 'src/common/response';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permRepo: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto) {
    const { code } = dto;
    const existing = await this.permRepo.findOne({
      where: { code },
    });

    if (existing)
      throw new AppException(
        'Permission already exists',
        'PERMISSION_EXISTS',
        400,
      );

    const perm = this.permRepo.create({ code });
    await this.permRepo.save(perm);

    return successResponse({ message: 'Permission created', data: perm });
  }

  async findAll() {
    const perm = await this.permRepo.find();
    return successResponse({
      message: 'Get permissions successfully',
      data: perm,
    });
  }

  async findOne(id: number) {
    const perm = await this.permRepo.findOne({ where: { id } });

    if (!perm)
      throw new AppException(
        'Permission not found',
        'PERMISSION_NOT_FOUND',
        404,
      );

    return successResponse({
      message: 'Get permission successfully',
      data: perm,
    });
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const perm = await this.permRepo.findOne({ where: { id } });

    if (!perm)
      throw new AppException(
        'Permission not found',
        'PERMISSION_NOT_FOUND',
        404,
      );

    const { code } = dto;

    if (code) {
      const existing = await this.permRepo.findOne({
        where: { code, id: Not(id) },
      });

      if (existing)
        throw new AppException(
          'Permission code already exists',
          'PERMISSION_CODE_EXISTS',
          400,
        );
      perm.code = code;
    }

    await this.permRepo.save(perm);
    return successResponse({ message: 'Permission updated', data: perm });
  }

  async remove(id: number) {
    await this.permRepo.delete(id);
    return successResponse({ message: 'Permission deleted', data: null });
  }
}
