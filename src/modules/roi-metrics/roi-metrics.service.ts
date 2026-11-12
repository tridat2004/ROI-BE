import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoiMetric } from './entities/roi-metric.entity';
import { RoiCalculationService } from './roi-calculate.service';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { RoiProject } from '../roi-projects/entities/roi-project.entity';
import { successResponse } from 'src/common/response';
import { RoiFieldValue } from '../roi-field-values/entities/roi-field-value.entity';
import { RecalculateRoiDto } from './dto/recalculate-roi.dto';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoiMetricsService {
  constructor(
    @InjectRepository(RoiMetric)
    private metricRepo: Repository<RoiMetric>,
    private roiCalculationService: RoiCalculationService,

    @InjectRepository(RoiProjectVersion)
    private versionRepo: Repository<RoiProjectVersion>,

    @InjectRepository(RoiFieldValue)
    private fieldValueRepo: Repository<RoiFieldValue>,

    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,

    @InjectRepository(RoiProject)
    private projectRepo: Repository<RoiProject>,
  ) { }

  async calculate(versionId: number, user: any) {
    const version = await this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version || !version.project || !version.project.owner) {
      throw new NotFoundException(`Version ${versionId} not found or owner is deleted`);
    }

    await this.checkAccess(user, version.project.owner?.id);

    return this.roiCalculationService.calculate(versionId, user.id);
  }

  async findByVersion(versionId: number, user: any) {
    const version = await this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version || !version.project || !version.project.owner) {
      throw new NotFoundException(`Version ${versionId} not found or owner is deleted`);
    }

    await this.checkAccess(user, version.project.owner?.id);

    return this.roiCalculationService.findByVersion(versionId);
  }


  async recalculate(versionId: number, dto: RecalculateRoiDto, user: any) {
    const version = await this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version || !version.project || !version.project.owner) {
      throw new NotFoundException(`Version ${versionId} not found or owner is deleted`);
    }

    await this.checkAccess(user, version.project.owner?.id);

    return this.roiCalculationService.recalculate(versionId, dto, user.id);
  }

  async compareVersions(versionId1: number, versionId2: number, user: any) {
    const v1 = await this.versionRepo.findOne({
      where: { id: versionId1 },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    const v2 = await this.versionRepo.findOne({
      where: { id: versionId2 },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!v1 || !v2) {
      throw new NotFoundException('Version not found');
    }

    await this.checkAccess(user, v1.project.owner?.id);
    await this.checkAccess(user, v2.project.owner?.id);

    // check cùng project
    if (v1.project.id !== v2.project.id) {
      throw new BadRequestException(
        'Versions must belong to the same ROI project',
      );
    }

    // check status phải success
    if (v1.status !== 'success' || v2.status !== 'success') {
      throw new BadRequestException(
        'Both versions must be calculated (status = success) before comparison',
      );
    }

    const metricsV1 = await this.metricRepo.find({
      where: { version: { id: versionId1 } },
      relations: ['scenario'],
    });

    if (metricsV1.length === 0) {
      throw new BadRequestException(
        `Version ${versionId1} has not been calculated`,
      );
    }

    const metricsV2 = await this.metricRepo.find({
      where: { version: { id: versionId2 } },
      relations: ['scenario'],
    });

    if (metricsV2.length === 0) {
      throw new BadRequestException(
        `Version ${versionId2} has not been calculated`,
      );
    }

    const mapV1 = new Map<string, RoiMetric>();
    const mapV2 = new Map<string, RoiMetric>();

    const key = (m: RoiMetric) => `${m.metricCode}_${m.scenario?.id ?? 'base'}`;

    metricsV1.forEach((m) => mapV1.set(key(m), m));
    metricsV2.forEach((m) => mapV2.set(key(m), m));

    const keys = new Set([...mapV1.keys(), ...mapV2.keys()]);

    const result: Array<{
      metricCode: string | undefined;
      scenarioId: number | null;
      version1: number | null;
      version2: number | null;
      diff: number | null;
    }> = [];

    for (const k of keys) {
      const m1 = mapV1.get(k);
      const m2 = mapV2.get(k);

      const v1Value =
        m1?.valueNumeric !== null && m1?.valueNumeric !== undefined
          ? Number(m1.valueNumeric)
          : null;

      const v2Value =
        m2?.valueNumeric !== null && m2?.valueNumeric !== undefined
          ? Number(m2.valueNumeric)
          : null;

      const diff =
        v1Value !== null && v2Value !== null ? v1Value - v2Value : null;

      result.push({
        metricCode: m1?.metricCode || m2?.metricCode,
        scenarioId: m1?.scenario?.id ?? m2?.scenario?.id ?? null,
        version1: v1Value,
        version2: v2Value,
        diff,
      });
    }

    /**
     * =================================
     * COMPARE ROI FIELD VALUES (11 fields)
     * =================================
     */

    const fieldsV1 = await this.fieldValueRepo.find({
      where: { version: { id: versionId1 } },
      relations: ['field'],
    });

    const fieldsV2 = await this.fieldValueRepo.find({
      where: { version: { id: versionId2 } },
      relations: ['field'],
    });

    const fieldMap1 = new Map<number, RoiFieldValue>();
    const fieldMap2 = new Map<number, RoiFieldValue>();

    fieldsV1.forEach((f) => fieldMap1.set(f.field.id, f));
    fieldsV2.forEach((f) => fieldMap2.set(f.field.id, f));

    const fieldIds = new Set([...fieldMap1.keys(), ...fieldMap2.keys()]);

    const fieldResults: Array<{
      fieldCode: string | undefined;
      version1: number | null;
      version2: number | null;
      diff: number | null;
    }> = [];

    for (const id of fieldIds) {
      const f1 = fieldMap1.get(id);
      const f2 = fieldMap2.get(id);

      const v1Value =
        f1?.valueNumeric !== null && f1?.valueNumeric !== undefined
          ? Number(f1.valueNumeric)
          : null;

      const v2Value =
        f2?.valueNumeric !== null && f2?.valueNumeric !== undefined
          ? Number(f2.valueNumeric)
          : null;

      const diff =
        v1Value !== null && v2Value !== null ? v1Value - v2Value : null;

      fieldResults.push({
        fieldCode: f1?.field.code || f2?.field.code,
        version1: v1Value,
        version2: v2Value,
        diff,
      });
    }

    return successResponse({
      message: 'Versions compared successfully',
      data: {
        projectId: v1.project.id,
        version1: versionId1,
        version2: versionId2,
        metrics: result,
        fields: fieldResults,
      },
    });
  }

  async softDelete(id: number, user: any) {
    const entity = await this.metricRepo.findOne({
      where: { id, isActive: true },
      relations: ['version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!entity || !entity.version || !entity.version.project || !entity.version.project.owner) {
      throw new BadRequestException('ROI Metric not found or owner is deleted');
    }

    await this.checkAccess(user, entity.version.project.owner?.id);

    await this.metricRepo.update(id, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: user.id,
    });

    return successResponse({
      message: 'ROI Metric deleted successfully',
      data: null,
    });
  }

  async getProjectMetricsSummary(
    user: any,
    sortBy?: 'annualSaving' | 'paybackMonths',
    sortOrder?: 'ASC' | 'DESC',
    scenarioId?: number,
    limit: number = 10,
    page: number = 1,
    projectName?: string,
    ownerName?: string,
  ) {
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

    // 1. Logic lọc tương tự findAll
    const qb = this.projectRepo
      .createQueryBuilder('project')
      .withDeleted()
      .leftJoin('users', 'owner', 'owner.id = project.owner_user_id')
      .innerJoin(
        'roi_project_versions',
        'version',
        `version.project_id = project.id 
         AND version.is_active = true 
         AND version.status = 'success'
         AND version.id = (
             SELECT v2.id FROM roi_project_versions v2 
             WHERE v2.project_id = project.id 
               AND v2.status = 'success' 
               AND v2.is_active = true 
             ORDER BY v2.created_at DESC 
             LIMIT 1
         )`
      )
      .leftJoin(
        'roi_metrics',
        'metric',
        `metric.version_id = version.id AND metric.is_active = true ${scenarioId ? 'AND metric.scenario_id = :scenarioId' : ''}`,
        { scenarioId }
      )
      .leftJoin(
        'roi_scenarios',
        'scenario',
        'metric.scenario_id = scenario.id',
      )
      .where('project.isActive = true');

    if (!isAdminOrManager) {
      if (isSaleOrViewer) {
        qb.andWhere('owner.id = :userId', { userId: user.id });
      } else {
        return successResponse({
          message: 'Get project metrics summary successfully',
          data: [],
          meta: { totalProjects: 0, totalAnnualSaving: 0 },
        });
      }
    }

    if (projectName) {
      qb.andWhere('project.projectName ILIKE :projectName', {
        projectName: `%${projectName}%`,
      });
    }

    if (ownerName) {
      qb.andWhere('owner.full_name ILIKE :ownerName', {
        ownerName: `%${ownerName}%`,
      });
    }

    const annualSavingExpr = `COALESCE(MAX(CASE WHEN metric.metric_code = 'annual_savings' THEN metric.value_numeric END), 0)`;
    const paybackMonthsExpr = `COALESCE(MAX(CASE WHEN metric.metric_code = 'payback_months' THEN metric.value_numeric END), 0)`;
    const roiMultipleExpr = `COALESCE(MAX(CASE WHEN metric.metric_code = 'roi_multiple' THEN metric.value_numeric END), 0)`;

    qb.select([
      'project.id AS "projectId"',
      'project.projectName AS "projectName"',
      'project.customerName AS "customerName"',
      'project.industry AS "industry"',
      'version.id AS "versionId"',
      'version.versionNo AS "versionNo"',
      'version.title AS "versionName"',
      'version.status AS "status"',
      'scenario.name AS "scenarioName"',
      `${annualSavingExpr} AS "annualSaving"`,
      `${paybackMonthsExpr} AS "paybackMonths"`,
      `${roiMultipleExpr} AS "roiMultiple"`,
    ])
      .groupBy('project.id')
      .addGroupBy('project.projectName')
      .addGroupBy('project.customerName')
      .addGroupBy('project.industry')
      .addGroupBy('version.id')
      .addGroupBy('version.versionNo')
      .addGroupBy('version.title')
      .addGroupBy('version.status')
      .addGroupBy('scenario.name');

    const normalizedSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    if (sortBy === 'annualSaving') {
      qb.orderBy(annualSavingExpr, normalizedSortOrder);
    } else if (sortBy === 'paybackMonths') {
      qb.orderBy(paybackMonthsExpr, normalizedSortOrder);
    } else {
      qb.orderBy('project.customerName', 'ASC').addOrderBy('version.id', 'ASC');
    }

    // 2. Tính toán tổng số project khớp với logic findAll
    const totalProjectsQuery = this.projectRepo
        .createQueryBuilder('project')
        .withDeleted()
        .leftJoin('users', 'owner', 'owner.id = project.owner_user_id')
        .where('project.isActive = true');
    
    if (!isAdminOrManager) {
        if (isSaleOrViewer) {
            totalProjectsQuery.andWhere('owner.id = :userId', { userId: user.id });
        } else {
            totalProjectsQuery.andWhere('1=0');
        }
    }
    
    if (projectName) {
        totalProjectsQuery.andWhere('project.projectName ILIKE :projectName', {
            projectName: `%${projectName}%`,
        });
    }

    if (ownerName) {
        totalProjectsQuery.andWhere('owner.full_name ILIKE :ownerName', {
            ownerName: `%${ownerName}%`,
        });
    }
    
    const totalProjects = await totalProjectsQuery.getCount();

    // 3. Tính toán tổng savings (của các project thỏa mãn filter)
    const summaryRawResults = await qb.getRawMany();
    const summary = {
      totalProjects: totalProjects,
      totalAnnualSaving: summaryRawResults.reduce(
        (sum, item) => sum + Number(item.annualSaving || 0),
        0,
      ),
    };

    qb.limit(limit);
    qb.offset((page - 1) * limit);

    const rawResults = await qb.getRawMany();

    const data = rawResults.map((r) => ({
      projectId: r.projectId,
      projectName: r.projectName,
      customerName: r.customerName,
      industry: r.industry,
      versionId: r.versionId,
      versionNo: r.versionNo,
      versionName: r.versionName,
      status: r.status,
      scenarioName: r.scenarioName,
      annualSaving: Number(r.annualSaving || 0),
      paybackMonths: Number(r.paybackMonths || 0).toFixed(2),
      roiMultiple: Number(r.roiMultiple || 0).toFixed(2),
    }));

    return successResponse({
      message: 'Get project metrics summary successfully',
      data,
      meta: summary,
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
