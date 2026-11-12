import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRoiChartPointDto } from './dto/create-roi-chart-point.dto';
import { UpdateRoiChartPointDto } from './dto/update-roi-chart-point.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoiChartPoint } from './entities/roi-chart-point.entity';
import { successResponse } from 'src/common/response';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RoiChartPointsService {
  constructor(
    @InjectRepository(RoiChartPoint)
    private roiChartPointRepo: Repository<RoiChartPoint>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  create(createRoiChartPointDto: CreateRoiChartPointDto) {
    return 'This action adds a new roiChartPoint';
  }

  findAll() {
    return `This action returns all roiChartPoints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roiChartPoint`;
  }

  update(id: number, updateRoiChartPointDto: UpdateRoiChartPointDto) {
    return `This action updates a #${id} roiChartPoint`;
  }

  async softDelete(id: number, user: any) {
    const entity = await this.roiChartPointRepo.findOne({
      where: { id },
      relations: ['version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('ROI Chart Point not found');
    }

    await this.checkAccess(user, entity.version.project.owner?.id);

    await this.roiChartPointRepo.update(id, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: user.id,
    });

    return successResponse({
      message: 'ROI Chart Point deleted successfully',
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
