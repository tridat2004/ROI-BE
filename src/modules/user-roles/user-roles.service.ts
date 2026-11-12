import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from './entities/user-role.entity';
import { Repository } from 'typeorm';
import { AppException } from 'src/common/exception';
import { successResponse } from 'src/common/response';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  async assign(userId: number, roleId: number) {
    const existing = await this.userRoleRepo.findOne({
      where: { userId, roleId },
    });
    if (existing)
      throw new AppException('Already assigned', 'ALREADY_ASSIGNED', 400);

    await this.userRoleRepo.save(this.userRoleRepo.create({ userId, roleId }));
    return successResponse({ message: 'Role assigned to user', data: null });
  }

  async revoke(userId: number, roleId: number) {
    await this.userRoleRepo.delete({ userId, roleId });
    return successResponse({ message: 'Role revoked from user', data: null });
  }

  async findByUser(userId: number) {
    const rows = await this.userRoleRepo.find({ where: { userId } });
    return successResponse({
      message: 'Get user roles successfully',
      data: rows,
    });
  }
}
