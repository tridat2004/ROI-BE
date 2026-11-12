import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto) {
    const log = this.auditLogRepo.create(createAuditLogDto);
    return this.auditLogRepo.save(log);
  }

  async findAll(user: any) {
    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
    });
    const userRoleIds = userRoles.map((ur) => Number(ur.roleId));
    const isAdminOrManager =
      userRoleIds.includes(AppRole.ADMIN) ||
      userRoleIds.includes(AppRole.MANAGER);

    if (isAdminOrManager) {
      return this.auditLogRepo.find({
        relations: ['actorUser'],
        order: { occurredAt: 'DESC' },
      });
    }

    return this.auditLogRepo.find({
      where: { actorUserId: user.id },
      relations: ['actorUser'],
      order: { occurredAt: 'DESC' },
    });
  }

  async findOne(id: number, user: any) {
    const log = await this.auditLogRepo.findOne({
      where: { id },
      relations: ['actorUser'],
      withDeleted: true,
    });

    if (!log) throw new NotFoundException('Audit log not found');

    await this.checkAccess(user, log.actorUserId);

    return log;
  }

  async update(id: number, updateAuditLogDto: UpdateAuditLogDto, user: any) {
    const log = await this.auditLogRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!log) throw new NotFoundException('Audit log not found');

    await this.checkAccess(user, log.actorUserId);

    return `This action updates a #${id} auditLog`;
  }

  async remove(id: number, user: any) {
    const log = await this.auditLogRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!log) throw new NotFoundException('Audit log not found');

    await this.checkAccess(user, log.actorUserId);

    return `This action removes a #${id} auditLog`;
  }

  private async checkAccess(user: any, actorUserId: number | string) {
    if (!user || (!user.id && !user.sub)) {
      throw new ForbiddenException('User information is missing');
    }

    const userId = user.id || user.sub;
    const userRoles = await this.userRoleRepo.find({
      where: { userId: Number(userId) },
    });

    const userRoleIds = userRoles.map((ur) => Number(ur.roleId));
    const isAdminOrManager =
      userRoleIds.includes(AppRole.ADMIN) ||
      userRoleIds.includes(AppRole.MANAGER);

    if (isAdminOrManager) return;

    if (actorUserId && Number(actorUserId) !== Number(userId)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
  }
}
