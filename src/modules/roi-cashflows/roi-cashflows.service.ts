import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRoiCashflowDto } from './dto/create-roi-cashflow.dto';
import { UpdateRoiCashflowDto } from './dto/update-roi-cashflow.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoiCashflow } from './entities/roi-cashflow.entity';
import { successResponse } from 'src/common/response';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RoiCashflowsService {
  constructor(
    @InjectRepository(RoiCashflow)
    private roiCashflowRepo: Repository<RoiCashflow>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  create(createRoiCashflowDto: CreateRoiCashflowDto) {
    return 'This action adds a new roiCashflow';
  }

  findAll() {
    return `This action returns all roiCashflows`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roiCashflow`;
  }

  update(id: number, updateRoiCashflowDto: UpdateRoiCashflowDto) {
    return `This action updates a #${id} roiCashflow`;
  }

  async softDelete(id: number, user: any) {
    const entity = await this.roiCashflowRepo.findOne({
      where: { id },
      relations: ['version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('ROI Cashflow not found');
    }

    await this.checkAccess(user, entity.version.project.owner?.id);

    await this.roiCashflowRepo.update(id, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: user.id,
    });

    return successResponse({
      message: 'ROI Cashflow deleted successfully',
      data: null,
    });
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
