import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRoiProjectDto } from './dto/create-roi-project.dto';
import { UpdateRoiProjectDto } from './dto/update-roi-project.dto';
import { RoiProject } from './entities/roi-project.entity';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { RoiVersionScenario } from '../roi-version-scenarios/entities/roi-version-scenario.entity';
import { RoiScenario } from '../roi-scenarios/entities/roi-scenario.entity';
import { successResponse } from 'src/common/response';
import { User } from '../users/entities/user.entity';
import { RoiFieldValue } from '../roi-field-values/entities/roi-field-value.entity';
import { RoiMetric } from '../roi-metrics/entities/roi-metric.entity';
import { RoiCashflow } from '../roi-cashflows/entities/roi-cashflow.entity';
import { RoiChartPoint } from '../roi-chart-points/entities/roi-chart-point.entity';
import { ExportJob } from '../export-jobs/entities/export-job.entity';
import { ShareLink } from '../share-links/entities/share-link.entity';
import { AuditService } from 'src/common/audit.service';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RoiProjectsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(RoiProject)
    private roiProjectRepo: Repository<RoiProject>,

    @InjectRepository(RoiProjectVersion)
    private roiProjectVersionRepo: Repository<RoiProjectVersion>,

    @InjectRepository(RoiVersionScenario)
    private roiVersionScenarioRepo: Repository<RoiVersionScenario>,

    @InjectRepository(RoiScenario)
    private roiScenarioRepo: Repository<RoiScenario>,

    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,

    private auditService: AuditService,
  ) { }


  private async checkUniqueProjectName(name: string, excludeId?: number) {
    const query = this.roiProjectRepo
      .createQueryBuilder('project')
      .where('LOWER(project.projectName) = LOWER(:name)', { name })
      .andWhere('project.isActive = true');

    if (excludeId) {
      query.andWhere('project.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new BadRequestException('Project name already exists');
    }
  }

  async create(
    dto: CreateRoiProjectDto,
    userId: number,
    ip?: string,
    userAgent?: string,
  ) {
    await this.checkUniqueProjectName(dto.projectName);
    return this.dataSource.transaction(async (manager) => {
      const roiProject = manager.create(RoiProject, {
        projectName: dto.projectName,
        customerName: dto.customerName,
        industry: dto.industry,
        owner: { id: userId },
        status: 'pending',
      });

      const savedProject = await manager.save(roiProject);

      const version = manager.create(RoiProjectVersion, {
        project: savedProject,
        versionNo: 1,
        title: 'Initial Version',
        createdBy: { id: userId },
        isLockedSnapshot: false,
        calculationModelVersion: 'v1',
        status: 'pending',
      });

      const savedVersion = await manager.save(version);

      savedProject.currentVersionId = savedVersion.id;
      await manager.save(savedProject);

      const scenarios = await manager.find(RoiScenario);

      const versionScenarios = scenarios.map((scenario) =>
        manager.create(RoiVersionScenario, {
          version: { id: savedVersion.id },
          scenario: { id: scenario.id },
          workforceReduction:
            scenario.id === 1 ? 60 : scenario.id === 2 ? 70 : 80,
          throughputMultiplier:
            scenario.id === 1 ? 5 : scenario.id === 2 ? 7 : 10,
        }),
      );

      // console.log(versionScenarios);

      await manager.save(versionScenarios);

      // Ghi audit log cho việc tạo version
      await this.auditService.logAudit({
        action: 'CREATE',
        entityType: 'roi_project_version',
        entityId: savedVersion.id,
        userId: userId,
        ip,
        userAgent,
        changes: [
          {
            fieldCode: 'version_no',
            newValue: savedVersion.versionNo,
          },
          {
            fieldCode: 'title',
            newValue: savedVersion.title,
          },
          {
            fieldCode: 'status',
            newValue: savedVersion.status,
          },
          {
            fieldCode: 'project_id',
            newValue: savedProject.id,
          },
        ],
      });

      return successResponse({
        message: 'ROI Project created successfully',
        data: {
          projectId: Number(savedProject.id),
          versionNo: Number(savedVersion.versionNo),
          versionId: Number(savedVersion.id),
        },
      });
    });
  }

  async findAll(
    user: any,
    page: number = 1,
    limit: number = 10,
    projectName?: string,
    ownerName?: string,
  ) {
    const skip = (page - 1) * limit;

    // 1. Get user roles
    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
    });
    const userRoleIds = userRoles.map((ur) => Number(ur.roleId));

    const isAdminOrManager =
      userRoleIds.includes(AppRole.ADMIN) ||
      userRoleIds.includes(AppRole.MANAGER);

    const isSaleOrViewer =
      userRoleIds.includes(AppRole.SALE) ||
      userRoleIds.includes(AppRole.VIEWER);

    // 2. Build Query
    const query = this.roiProjectRepo
      .createQueryBuilder('project')
      .withDeleted()
      .leftJoinAndSelect('project.owner', 'owner', 'owner.id = project.owner_user_id')
      .leftJoinAndSelect('project.lockedBy', 'lockedBy')
      .where('project.isActive = :isActive', { isActive: true });

    if (!isAdminOrManager) {
      if (isSaleOrViewer) {
        query.andWhere('owner.id = :userId', { userId: user.id });
      } else {
        // No relevant roles, return empty
        return successResponse({
          message: 'ROI Projects retrieved successfully',
          data: [],
          meta: {
            totalItems: 0,
            itemCount: 0,
            itemsPerPage: limit,
            totalPages: 0,
            currentPage: page,
          },
        });
      }
    }

    // 3. Apply search filters
    if (projectName) {
      query.andWhere('project.projectName ILIKE :projectName', {
        projectName: `%${projectName}%`,
      });
    }

    if (ownerName) {
      query.andWhere('owner.full_name ILIKE :ownerName', {
        ownerName: `%${ownerName}%`,
      });
    }

    const [projects, totalItems] = await query
      .orderBy('project.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const versionIds = projects.map((p) => p.currentVersionId).filter(Boolean);
    const versions = versionIds.length
      ? await this.roiProjectVersionRepo.findBy({
        id: In(versionIds),
      })
      : [];
    const versionMap = new Map(versions.map((v) => [Number(v.id), v]));

    let metricsMap = new Map();
    if (projects.length > 0) {
      const projectIds = projects.map((p) => Number(p.id));
      const metricsData = await this.dataSource.query(
        `
        SELECT 
            p.id as project_id,
            MAX(CASE WHEN (TRIM(LOWER(s.name)) = 'base' OR s.code = 'SCE2' OR s.code = 'base') AND m.metric_code = 'annual_savings' THEN m.value_numeric END) as annual_saving,
            MAX(CASE WHEN (TRIM(LOWER(s.name)) = 'base' OR s.code = 'SCE2' OR s.code = 'base') AND m.metric_code = 'payback_months' THEN m.value_numeric END) as payback_months,
            MAX(CASE WHEN (TRIM(LOWER(s.name)) = 'base' OR s.code = 'SCE2' OR s.code = 'base') AND m.metric_code = 'roi_multiple'   THEN m.value_numeric END) as roi_multiple
        FROM roi_projects p
        JOIN roi_project_versions v ON v.id = (
            SELECT v2.id FROM roi_project_versions v2 
            WHERE v2.project_id = p.id 
              AND v2.is_active = true 
              AND (v2.status = 'success' OR v2.version_no = 1)
            ORDER BY 
                CASE WHEN v2.status = 'success' THEN 1 WHEN v2.version_no = 1 THEN 2 ELSE 3 END ASC,
                v2.version_no DESC
            LIMIT 1
        )
        LEFT JOIN roi_metrics m ON m.version_id = v.id AND m.is_active = true
        LEFT JOIN roi_scenarios s ON m.scenario_id = s.id
        WHERE p.id IN (${projectIds.join(',')})
        GROUP BY p.id
        `,
      );

      metricsMap = new Map(
        metricsData.map((m) => [
          Number(m.project_id),
          {
            annualSaving: m.annual_saving,
            paybackMonths: m.payback_months,
            roi_multiple: m.roi_multiple,
          },
        ]),
      );
    }

    const data = projects.map((p) => {
      const version = versionMap.get(Number(p.currentVersionId));
      const metrics = metricsMap.get(Number(p.id));
      const { currentVersionId, owner, lockedBy, ...rest } = p;

      return {
        ...rest,
        owner: owner
          ? {
            id: owner.id,
            email: owner.email,
            fullName: owner.fullName,
            status: owner.status,
          }
          : null,
        lockedBy: lockedBy
          ? {
            id: lockedBy.id,
            email: lockedBy.email,
            fullName: lockedBy.fullName,
            status: lockedBy.status,
          }
          : null,
        status: version?.status ?? p.status,
        versionNo: version?.versionNo ?? null,
        annualSaving: metrics?.annualSaving != null ? Number(metrics.annualSaving).toFixed(2) : 'N/A',
        paybackMonths: metrics?.paybackMonths != null ? Number(metrics.paybackMonths).toFixed(2) : 'N/A',
        roi_multiple: metrics?.roi_multiple != null ? Number(metrics.roi_multiple).toFixed(2) : 'N/A',
      };
    });

    return successResponse({
      message: 'ROI Projects retrieved successfully',
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  }

  async findOne(id: number, user: any) {
    const project = await this.roiProjectRepo.findOne({
      where: { id, isActive: true },
      relations: ['owner', 'lockedBy'],
      withDeleted: true,
    });

    if (!project || !project.owner) {
      throw new NotFoundException('Project not found');
    }

    await this.checkAccess(user, project.owner?.id);

    const { owner, lockedBy, ...rest } = project;

    const formattedData = {
      ...rest,
      owner: owner
        ? {
          id: owner.id,
          email: owner.email,
          fullName: owner.fullName,
          status: owner.status,
        }
        : null,
      lockedBy: lockedBy
        ? {
          id: lockedBy.id,
          email: lockedBy.email,
          fullName: lockedBy.fullName,
          status: lockedBy.status,
        }
        : null,
    };

    return successResponse({
      message: 'ROI Project retrieved successfully',
      data: formattedData,
    });
  }

  async update(id: number, dto: UpdateRoiProjectDto, user: any) {
    const project = await this.roiProjectRepo.findOne({
      where: { id },
      relations: ['owner'],
      withDeleted: true,
    });

    if (!project || !project.owner) {
      throw new BadRequestException('Project not found');
    }

    await this.checkAccess(user, project.owner?.id);

    if (dto.projectName) await this.checkUniqueProjectName(dto.projectName, id);

    if (dto.industry === null) {
      throw new BadRequestException('Industry cannot be empty');
    }

    if (dto.customerName === null) {
      throw new BadRequestException('Customer name cannot be empty');
    }

    project.industry = dto.industry;
    project.customerName = dto.customerName;
    if (dto.projectName) project.projectName = dto.projectName;

    project.updatedAt = new Date();
    // project.owner = { id: user.id } as User; // Do NOT change owner during update unless intended

    await this.roiProjectRepo.save(project);

    return successResponse({
      message: 'ROI Project updated successfully',
      data: project,
    });
  }

  async softDelete(id: number, user: any) {
    return this.dataSource.transaction(async (manager) => {
      const project = await manager.findOne(RoiProject, {
        where: { id },
        relations: ['owner'],
        withDeleted: true,
      });

      if (!project || !project.owner) {
        throw new BadRequestException('Project not found');
      }

      await this.checkAccess(user, project.owner?.id);

      if (project.isActive === false) {
        throw new BadRequestException('Project is already deleted');
      }

      const now = new Date();

      // lấy version ids
      const versions = await manager.find(RoiProjectVersion, {
        where: { project: { id } },
        select: ['id'],
      });

      const versionIds = versions.map((v) => v.id);

      if (versionIds.length > 0) {
        await manager.update(
          RoiFieldValue,
          { version: { id: In(versionIds) } },
          { isActive: false, deletedAt: now, deletedBy: user.id },
        );

        await manager.update(
          RoiVersionScenario,
          { version: { id: In(versionIds) } },
          { isActive: false, deletedAt: now, deletedBy: user.id },
        );

        await manager.update(
          RoiMetric,
          { version: { id: In(versionIds) } },
          { isActive: false, deletedAt: now, deletedBy: user.id },
        );

        await manager.update(
          RoiCashflow,
          { version: { id: In(versionIds) } },
          { isActive: false, deletedAt: now, deletedBy: user.id },
        );

        await manager.update(
          RoiChartPoint,
          { version: { id: In(versionIds) } },
          { isActive: false, deletedAt: now, deletedBy: user.id },
        );
      }

      await manager.update(
        ExportJob,
        { project: { id } },
        { isActive: false, deletedAt: now, deletedBy: user.id },
      );

      await manager.update(
        ShareLink,
        { project: { id } },
        { isActive: false, deletedAt: now, deletedBy: user.id },
      );

      await manager.update(
        RoiProjectVersion,
        { project: { id } },
        { isActive: false, deletedAt: now, deletedBy: user.id },
      );

      await manager.update(
        RoiProject,
        { id },
        { isActive: false, deletedAt: now, deletedBy: user.id },
      );

      return successResponse({
        message: 'ROI Project deleted successfully',
        data: null,
      });
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

  async getDashboard(userId: number) {
    const results = await this.dataSource.query(`
    SELECT
      p.id, p."projectName", p.customer_name, p.industry, p.status,
      v.id AS version_id, v.version_no, v.created_at,
      MAX(CASE WHEN m.metric_code = 'annual_savings' THEN m.value_numeric END) AS annual_savings,
      MAX(CASE WHEN m.metric_code = 'payback_months' THEN m.value_numeric END) AS payback_months,
      MAX(CASE WHEN m.metric_code = 'roi_multiple'   THEN m.value_numeric END) AS roi_multiple,
      MAX(CASE WHEN m.metric_code = 'npv'            THEN m.value_numeric END) AS npv
    FROM roi_projects p
    LEFT JOIN roi_project_versions v ON v.id = p.current_version_id
    LEFT JOIN roi_scenarios s        ON s.code = 'base'
    LEFT JOIN roi_metrics m          ON m.version_id = v.id
                                   AND m.scenario_id = s.id
    WHERE p.owner_user_id = $1
      AND p.is_active = true
    GROUP BY p.id, v.id
    ORDER BY p.updated_at DESC
  `, [userId]);

    return results.map(r => ({
      ...r,
      annual_savings: r.annual_savings != null ? Number(r.annual_savings).toFixed(2) : '0.00',
      payback_months: r.payback_months != null ? Number(r.payback_months).toFixed(2) : '0.00',
      roi_multiple: r.roi_multiple != null ? Number(r.roi_multiple).toFixed(2) : '0.00',
      npv: r.npv != null ? Number(r.npv).toFixed(2) : '0.00'
    }));
  }
}
