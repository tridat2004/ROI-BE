import { Injectable } from '@nestjs/common';
import { CreateExportJobDto } from './dto/create-export-job.dto';
import { UpdateExportJobDto } from './dto/update-export-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExportJob } from './entities/export-job.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Injectable()
export class ExportJobsService {
  constructor(
    @InjectRepository(ExportJob)
    private exportJobRepo: Repository<ExportJob>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  create(createExportJobDto: CreateExportJobDto, user: any) {
    return 'This action adds a new exportJob';
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
      return this.exportJobRepo.find({
        where: { isActive: true },
        relations: ['project', 'version', 'createdBy'],
      });
    }

    return this.exportJobRepo.find({
      where: { createdBy: { id: user.id }, isActive: true },
      relations: ['project', 'version', 'createdBy'],
    });
  }

  async findOne(id: number, user: any) {
    const job = await this.exportJobRepo.findOne({
      where: { id, isActive: true },
      relations: ['createdBy'],
      withDeleted: true,
    });

    if (!job) throw new NotFoundException('Export job not found');

    await this.checkAccess(user, job.createdBy?.id);

    return job;
  }

  async update(id: number, updateExportJobDto: UpdateExportJobDto, user: any) {
    const job = await this.exportJobRepo.findOne({
      where: { id, isActive: true },
      relations: ['createdBy'],
      withDeleted: true,
    });

    if (!job) throw new NotFoundException('Export job not found');

    await this.checkAccess(user, job.createdBy?.id);

    return `This action updates a #${id} exportJob`;
  }

  async remove(id: number, user: any) {
    const job = await this.exportJobRepo.findOne({
      where: { id, isActive: true },
      relations: ['createdBy'],
      withDeleted: true,
    });

    if (!job) throw new NotFoundException('Export job not found');

    await this.checkAccess(user, job.createdBy?.id);

    return `This action removes a #${id} exportJob`;
  }

  private async checkAccess(user: any, ownerId: number | string) {
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

    if (ownerId && Number(ownerId) !== Number(userId)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
  }
}
