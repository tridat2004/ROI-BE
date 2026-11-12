import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateRoiProjectVersionDto } from './dto/create-roi-project-version.dto';
import { UpdateRoiProjectVersionDto } from './dto/update-roi-project-version.dto';
import { DataSource, In, Repository } from 'typeorm';
import { RoiProjectVersion } from './entities/roi-project-version.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { successResponse } from 'src/common/response';
import { RoiFieldValue } from '../roi-field-values/entities/roi-field-value.entity';
import { RoiVersionScenario } from '../roi-version-scenarios/entities/roi-version-scenario.entity';
import { RoiMetric } from '../roi-metrics/entities/roi-metric.entity';
import { RoiCashflow } from '../roi-cashflows/entities/roi-cashflow.entity';
import { RoiChartPoint } from '../roi-chart-points/entities/roi-chart-point.entity';
import { AuditService } from 'src/common/audit.service';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';
import { RoiProject } from '../roi-projects/entities/roi-project.entity';

@Injectable()
export class RoiProjectVersionsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(RoiProjectVersion)
    private roiProjectVersionsRepository: Repository<RoiProjectVersion>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(RoiProject)
    private roiProjectRepo: Repository<RoiProject>,
    private auditService: AuditService,
  ) { }
  async create(createRoiProjectVersionDto: CreateRoiProjectVersionDto, user: any) {
    // Basic check if user owns the project they are creating a version for
    const project = await this.roiProjectRepo.findOne({
      where: { id: createRoiProjectVersionDto.projectId },
      relations: ['owner'],
      withDeleted: true,
    });

    if (!project) throw new NotFoundException('Project not found');

    await this.checkAccess(user, project.owner?.id);

    return 'This action adds a new roiProjectVersion';
  }

  async findAll(
    projectId: number,
    page: number = 1,
    limit: number = 10,
    user: any,
  ) {
    const project = await this.roiProjectRepo.findOne({
      where: { id: projectId },
      relations: ['owner'],
      withDeleted: true,
    });

    if (!project) throw new NotFoundException('Project not found');

    await this.checkAccess(user, project.owner?.id);

    const skip = (page - 1) * limit;

    const [versions, totalItems] = await this.roiProjectVersionsRepository
      .createQueryBuilder('version')
      .withDeleted()
      .leftJoinAndSelect('version.project', 'project')
      .leftJoinAndSelect('project.owner', 'owner', 'owner.id = project.owner_user_id')
      .where('project.id = :projectId', { projectId })
      .andWhere('version.isActive = true')
      .select([
        'version',
        'project',
        'owner.id',
        'owner.email',
        'owner.full_name',
      ])
      .orderBy('version.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const versionIds = versions.map((v) => Number(v.id));
    let metricsMap = new Map();

    if (versionIds.length > 0) {
      const metricsData = await this.dataSource.query(
        `
        SELECT 
            m.version_id,
            MAX(CASE WHEN (TRIM(LOWER(s.name)) = 'base' OR s.code = 'SCE2' OR s.code = 'base') AND m.metric_code = 'annual_savings' THEN m.value_numeric END) as annual_saving,
            MAX(CASE WHEN (TRIM(LOWER(s.name)) = 'base' OR s.code = 'SCE2' OR s.code = 'base') AND m.metric_code = 'payback_months' THEN m.value_numeric END) as payback_months,
            MAX(CASE WHEN (TRIM(LOWER(s.name)) = 'base' OR s.code = 'SCE2' OR s.code = 'base') AND m.metric_code = 'roi_multiple'   THEN m.value_numeric END) as roi_multiple
        FROM roi_metrics m
        LEFT JOIN roi_scenarios s ON m.scenario_id = s.id
        WHERE m.version_id IN (${versionIds.join(',')})
          AND m.is_active = true
        GROUP BY m.version_id
        `,
      );

      metricsMap = new Map(
        metricsData.map((m) => [
          Number(m.version_id),
          {
            annualSaving: m.annual_saving,
            paybackMonths: m.payback_months,
            roi_multiple: m.roi_multiple,
          },
        ]),
      );
    }

    const data: any[] = versions.map((v) => {
      const metrics = metricsMap.get(Number(v.id));
      return {
        ...v,
        annualSaving: metrics?.annualSaving !== null && metrics?.annualSaving !== undefined ? Number(metrics.annualSaving) : 'N/A',
        paybackMonths: metrics?.paybackMonths !== null && metrics?.paybackMonths !== undefined ? Math.round(Number(metrics.paybackMonths) * 100) / 100 : 'N/A',
        roi_multiple: metrics?.roi_multiple !== null && metrics?.roi_multiple !== undefined ? Number(metrics.roi_multiple) : 'N/A',
      };
    });

    return successResponse({
      message: 'Roi project versions retrieved successfully',
      data,
      meta: {
        totalItems,
        itemCount: versions.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  }

  async findOne(id: number, user: any) {
    const version = await this.roiProjectVersionsRepository.findOne({
      where: { id, isActive: true },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version) throw new NotFoundException('Version not found');

    await this.checkAccess(user, version.project.owner?.id);

    return successResponse({
      message: 'Roi project version retrieved successfully',
      data: version,
    });
  }

  async update(
    id: number,
    dto: UpdateRoiProjectVersionDto,
    user: any,
  ) {
    const version = await this.roiProjectVersionsRepository.findOne({
      where: { id, isActive: true },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version) throw new NotFoundException('Version not found');

    await this.checkAccess(user, version.project.owner?.id);

    version.title = dto.title;
    await this.roiProjectVersionsRepository.save(version);

    return successResponse({
      message: 'Version updated successfully',
      data: version,
    });
  }

  async softDeleteVersion(versionId: number, user: any) {
    const userId = user.id;
    return this.dataSource.transaction(async (manager) => {
      const version = await manager.findOne(RoiProjectVersion, {
        where: { id: versionId, isActive: true },
        relations: ['project', 'project.owner'],
        withDeleted: true,
      });

      if (!version) {
        throw new NotFoundException('Version not found');
      }

      await this.checkAccess(user, version.project.owner?.id);

      if (version.versionNo === 1) {
        throw new BadRequestException(
          'Cannot delete the first version of the project',
        );
      }

      const now = new Date();

      await manager.update(
        RoiFieldValue,
        { version: { id: versionId } },
        { isActive: false, deletedAt: now, deletedBy: userId },
      );

      await manager.update(
        RoiVersionScenario,
        { version: { id: versionId } },
        { isActive: false, deletedAt: now, deletedBy: userId },
      );

      await manager.update(
        RoiMetric,
        { version: { id: versionId } },
        { isActive: false, deletedAt: now, deletedBy: userId },
      );

      await manager.update(
        RoiCashflow,
        { version: { id: versionId } },
        { isActive: false, deletedAt: now, deletedBy: userId },
      );

      await manager.update(
        RoiChartPoint,
        { version: { id: versionId } },
        { isActive: false, deletedAt: now, deletedBy: userId },
      );

      await manager.update(
        RoiProjectVersion,
        { id: versionId },
        { isActive: false, deletedAt: now, deletedBy: userId },
      );

      await this.auditService.logAudit({
        action: 'DELETE',
        entityType: 'roi_project_version',
        entityId: versionId,
        userId,
        changes: [
          {
            fieldCode: 'is_active',
            oldValue: true,
            newValue: false,
          },
        ],
      });

      return successResponse({
        message: 'Version deleted successfully',
        data: null,
      });
    });
  }


  async remove(id: number, user: any) {
    const version = await this.roiProjectVersionsRepository.findOne({
      where: { id, isActive: true },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version) throw new NotFoundException('Version not found');

    await this.checkAccess(user, version.project.owner?.id);

    return `This action removes a #${id} roiProjectVersion`;
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
