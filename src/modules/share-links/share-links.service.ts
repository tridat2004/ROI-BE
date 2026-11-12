import { Injectable } from '@nestjs/common';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { UpdateShareLinkDto } from './dto/update-share-link.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareLink } from './entities/share-link.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Injectable()
export class ShareLinksService {
  constructor(
    @InjectRepository(ShareLink)
    private shareLinkRepo: Repository<ShareLink>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  create(createShareLinkDto: CreateShareLinkDto, user: any) {
    return 'This action adds a new shareLink';
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
      return this.shareLinkRepo.find({
        where: { isActive: true },
        relations: ['project', 'version', 'createdBy'],
      });
    }

    return this.shareLinkRepo.find({
      where: { createdBy: { id: user.id }, isActive: true },
      relations: ['project', 'version', 'createdBy'],
    });
  }

  async findOne(id: number, user: any) {
    const link = await this.shareLinkRepo.findOne({
      where: { id, isActive: true },
      relations: ['createdBy'],
      withDeleted: true,
    });

    if (!link) throw new NotFoundException('Share link not found');

    await this.checkAccess(user, link.createdBy?.id);

    return link;
  }

  async update(id: number, updateShareLinkDto: UpdateShareLinkDto, user: any) {
    const link = await this.shareLinkRepo.findOne({
      where: { id, isActive: true },
      relations: ['createdBy'],
      withDeleted: true,
    });

    if (!link) throw new NotFoundException('Share link not found');

    await this.checkAccess(user, link.createdBy?.id);

    return `This action updates a #${id} shareLink`;
  }

  async remove(id: number, user: any) {
    const link = await this.shareLinkRepo.findOne({
      where: { id, isActive: true },
      relations: ['createdBy'],
      withDeleted: true,
    });

    if (!link) throw new NotFoundException('Share link not found');

    await this.checkAccess(user, link.createdBy?.id);

    return `This action removes a #${id} shareLink`;
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
