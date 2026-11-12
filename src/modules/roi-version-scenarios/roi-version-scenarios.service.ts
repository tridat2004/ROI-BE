import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRoiVersionScenarioDto } from './dto/create-roi-version-scenario.dto';
import { UpdateRoiVersionScenarioDto } from './dto/update-roi-version-scenario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoiVersionScenario } from './entities/roi-version-scenario.entity';
import { successResponse } from 'src/common/response';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RoiVersionScenariosService {
  constructor(
    @InjectRepository(RoiVersionScenario)
    private roiVersionScenarioRepo: Repository<RoiVersionScenario>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  create(createRoiVersionScenarioDto: CreateRoiVersionScenarioDto) {
    return 'This action adds a new roiVersionScenario';
  }

  findAll() {
    return `This action returns all roiVersionScenarios`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roiVersionScenario`;
  }

  update(id: number, updateRoiVersionScenarioDto: UpdateRoiVersionScenarioDto) {
    return `This action updates a #${id} roiVersionScenario`;
  }

  async softDelete(id: number, user: any) {
    const entity = await this.roiVersionScenarioRepo.findOne({
      where: { id },
      relations: ['version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('ROI Version Scenario not found');
    }

    await this.checkAccess(user, entity.version.project.owner?.id);

    await this.roiVersionScenarioRepo.update(id, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: user.id,
    });

    return successResponse({
      message: 'ROI Version Scenario deleted successfully',
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
