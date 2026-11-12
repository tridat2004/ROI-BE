import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRoiFieldValueDto } from './dto/create-roi-field-value.dto';
import { UpdateRoiFieldValueDto } from './dto/update-roi-field-value.dto';
import { RoiFieldValue } from './entities/roi-field-value.entity';
import { DataSource, In, Repository } from 'typeorm';
import { successResponse } from 'src/common/response';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { RoiVersionScenario } from '../roi-version-scenarios/entities/roi-version-scenario.entity';
import { RoiFieldDefinition } from '../roi-field-definitions/entities/roi-field-definition.entity';
import { AuditService } from 'src/common/audit.service';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { AppRole } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RoiFieldValuesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RoiFieldValue)
    private roiFieldValueRepo: Repository<RoiFieldValue>,

    @InjectRepository(RoiFieldDefinition)
    private roiFieldDefinitionRepo: Repository<RoiFieldDefinition>,

    @InjectRepository(RoiProjectVersion)
    private roiProjectVersionRepo: Repository<RoiProjectVersion>,

    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,

    private auditService: AuditService,
  ) { }
  async create(
    dto: CreateRoiFieldValueDto,
    user: any,
    ip?: string,
    userAgent?: string,
  ) {
    const userId = user.id;
    const version = await this.roiProjectVersionRepo.findOne({
      where: { id: dto.versionId },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version) {
      throw new NotFoundException('Project version not found');
    }

    await this.checkAccess(user, version.project.owner?.id);

    const existingFieldValuesCount = await this.roiFieldValueRepo.count({
      where: { version: { id: dto.versionId }, isActive: true },
    });

    if (existingFieldValuesCount > 0) {
      throw new BadRequestException(
        'ROI field values for this version already exist',
      );
    }

    if (!dto.fields || dto.fields.length === 0) {
      throw new BadRequestException('Fields cannot be empty');
    }

    // validate duplicate fieldId
    const fieldIds = dto.fields.map((f) => f.fieldId);

    const uniqueIds = new Set(fieldIds);
    if (uniqueIds.size !== fieldIds.length) {
      throw new BadRequestException('Duplicate fieldId detected');
    }

    // lấy rule từ bảng roi_fields
    const fieldDefs = await this.roiFieldDefinitionRepo.find({
      where: { id: In(fieldIds) },
    });

    if (fieldDefs.length !== dto.fields.length) {
      throw new BadRequestException('Some fieldId are invalid');
    }

    const fieldDefMap = new Map(fieldDefs.map((d) => [d.id, d]));

    // validate min / max
    for (const field of dto.fields) {
      const def = fieldDefMap.get(field.fieldId);

      if (!def) {
        throw new BadRequestException(`Invalid fieldId ${field.fieldId}`);
      }

      if (def.minValue !== null && field.value < def.minValue) {
        throw new BadRequestException(`${def.code} must be >= ${def.minValue}`);
      }

      if (def.maxValue !== null && field.value > def.maxValue) {
        throw new BadRequestException(`${def.code} must be <= ${def.maxValue}`);
      }
    }

    // save field values
    const values = dto.fields.map((field) =>
      this.roiFieldValueRepo.create({
        version: { id: dto.versionId },
        field: { id: field.fieldId },
        valueNumeric: field.value,
        isEstimated: false,
      }),
    );

    await this.roiFieldValueRepo.save(values);

    // Ghi audit log cho việc tạo field values
    for (const value of values) {
      await this.auditService.logAudit({
        action: 'CREATE',
        entityType: 'roi_field_value',
        entityId: value.id,
        userId: userId,
        ip,
        userAgent,
        changes: [
          {
            fieldCode: 'value_numeric',
            newValue: value.valueNumeric,
          },
          {
            fieldCode: 'field_id',
            newValue: value.field.id,
          },
          {
            fieldCode: 'version_id',
            newValue: dto.versionId,
          },
        ],
      });
    }

    // Kiểm tra nếu đã nhập đủ field values, set status = 'success'
    const totalRequired = await this.roiFieldDefinitionRepo.count({
      where: { isRequired: true },
    });

    const fieldValueCount = await this.roiFieldValueRepo.count({
      where: { version: { id: dto.versionId }, isActive: true },
    });

    const isComplete = fieldValueCount >= totalRequired;
    const newStatus = isComplete ? 'success' : 'pending';

    let statusChanged = false;
    const oldStatus = version.status;

    if (version.status !== newStatus) {
      version.status = newStatus;
      await this.roiProjectVersionRepo.save(version);
      statusChanged = true;
    }

    // Ghi audit log cho việc thay đổi status nếu có
    if (statusChanged) {
      await this.auditService.logAudit({
        action: 'UPDATE',
        entityType: 'roi_project_version',
        entityId: dto.versionId,
        userId: userId,
        ip,
        userAgent,
        changes: [
          {
            fieldCode: 'status',
            oldValue: oldStatus,
            newValue: version.status,
          },
        ],
      });
    }

    return successResponse({
      message: 'ROI field values saved successfully',
      data: values,
    });
  }

  async createNewVersion(
    user: any,
    dto: CreateRoiFieldValueDto,
    ip?: string,
    userAgent?: string,
  ) {
    const userId = user.id;
    return this.dataSource.transaction(async (manager) => {
      if (!dto.fields || dto.fields.length === 0) {
        throw new BadRequestException('Fields cannot be empty');
      }

      // validate fields theo rule DB
      const fieldIds = dto.fields.map((f) => f.fieldId);

      const uniqueIds = new Set(fieldIds);
      if (uniqueIds.size !== fieldIds.length) {
        throw new BadRequestException('Duplicate fieldId detected');
      }

      // lấy rule từ bảng roi_fields
      const fieldDefs = await manager.find(RoiFieldDefinition, {
        where: { id: In(fieldIds) },
      });

      if (fieldDefs.length !== dto.fields.length) {
        throw new BadRequestException('Some fieldId are invalid');
      }

      const fieldDefMap = new Map(fieldDefs.map((d) => [d.id, d]));

      for (const field of dto.fields) {
        const def = fieldDefMap.get(field.fieldId);

        if (!def) {
          throw new BadRequestException(`Invalid fieldId ${field.fieldId}`);
        }

        if (def.minValue !== null && field.value < def.minValue) {
          throw new BadRequestException(
            `${def.code} must be >= ${def.minValue}`,
          );
        }

        if (def.maxValue !== null && field.value > def.maxValue) {
          throw new BadRequestException(
            `${def.code} must be <= ${def.maxValue}`,
          );
        }
      }

      const currentVersion = await manager.findOne(RoiProjectVersion, {
        where: { id: dto.versionId },
        relations: ['project', 'project.owner'],
        withDeleted: true,
      });

      if (!currentVersion) {
        throw new NotFoundException('Current version not found');
      }

      await this.checkAccess(user, currentVersion.project.owner?.id);

      const project = currentVersion.project;

      const activeLastVersion = await manager.findOne(RoiProjectVersion, {
        where: { project: { id: project.id }, isActive: true },
        order: { versionNo: 'DESC' },
      });

      if (!activeLastVersion) {
        throw new BadRequestException('No active version found');
      }

      const nextVersionNo = activeLastVersion.versionNo + 1;

      // Kiểm tra điều kiện tạo version mới: version được chọn (truyền lên) phải có status 'success'
      if (currentVersion.status !== 'success') {
        throw new BadRequestException(
          `Cannot create new version: version ${currentVersion.versionNo || 'selected'} must be finalized with status "success"`,
        );
      }

      // tạo version mới
      const newVersion = manager.create(RoiProjectVersion, {
        project,
        versionNo: nextVersionNo,
        title: `Version ${nextVersionNo}`,
        createdBy: { id: userId },
        isLockedSnapshot: false,
        calculationModelVersion: currentVersion.calculationModelVersion,
        status: 'pending',
      });

      const savedVersion = await manager.save(newVersion);

      // lưu field values từ DTO
      const newFieldValues = dto.fields.map((field) =>
        manager.create(RoiFieldValue, {
          version: savedVersion,
          field: { id: field.fieldId },
          valueNumeric: field.value,
          isEstimated: false,
        }),
      );

      await manager.save(newFieldValues);

      // Ghi audit log cho việc tạo version mới
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
            newValue: project.id,
          },
        ],
      });

      // Ghi audit log cho việc tạo field values mới
      for (const fieldValue of newFieldValues) {
        await this.auditService.logAudit({
          action: 'CREATE',
          entityType: 'roi_field_value',
          entityId: fieldValue.id,
          userId: userId,
          ip,
          userAgent,
          changes: [
            {
              fieldCode: 'value_numeric',
              newValue: fieldValue.valueNumeric,
            },
            {
              fieldCode: 'field_id',
              newValue: fieldValue.field.id,
            },
            {
              fieldCode: 'version_id',
              newValue: savedVersion.id,
            },
          ],
        });
      }

      // clone scenarios
      const oldScenarios = await manager.find(RoiVersionScenario, {
        where: { version: { id: currentVersion.id } },
        relations: ['scenario'],
      });

      const newScenarios = oldScenarios.map((s) =>
        manager.create(RoiVersionScenario, {
          version: savedVersion,
          scenario: s.scenario,
          workforceReduction: s.workforceReduction,
          throughputMultiplier: s.throughputMultiplier,
        }),
      );

      if (newScenarios.length > 0) {
        await manager.save(newScenarios);
      }

      // update current version của project
      project.currentVersionId = savedVersion.id;
      await manager.save(project);

      return {
        message: 'New ROI version created successfully',
        data: {
          projectId: project.id,
          versionId: savedVersion.id,
          versionNo: savedVersion.versionNo,
        },
      };
    });
  }

  async findAll(user: any) {
    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
    });
    const userRoleIds = userRoles.map((ur) => Number(ur.roleId));
    const isAdminOrManager =
      userRoleIds.includes(AppRole.ADMIN) ||
      userRoleIds.includes(AppRole.MANAGER);

    const queryBuilder = this.roiFieldValueRepo
      .createQueryBuilder('fieldValue')
      .leftJoinAndSelect('fieldValue.field', 'field')
      .leftJoinAndSelect('fieldValue.version', 'version')
      .leftJoinAndSelect('version.project', 'project')
      .where('fieldValue.isActive = :isActive', { isActive: true });

    if (!isAdminOrManager) {
      queryBuilder.andWhere('project.owner_user_id = :userId', {
        userId: user.id,
      });
    }

    const values = await queryBuilder.orderBy('fieldValue.id', 'DESC').getMany();

    return successResponse({
      message: 'ROI field values retrieved successfully',
      data: values,
    });
  }

  async findOne(id: number, user: any) {
    const data = await this.roiFieldValueRepo.findOne({
      where: { id },
      relations: ['field', 'version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!data) {
      throw new NotFoundException('ROI Field Value not found');
    }

    await this.checkAccess(user, data.version.project.owner?.id);

    return successResponse({
      message: 'ROI Field Value retrieved successfully',
      data,
    });
  }

  async findOneVersion(versionId: number, user: any) {
    const version = await this.roiProjectVersionRepo.findOne({
      where: { id: versionId },
      relations: ['project', 'project.owner'],
      withDeleted: true,
    });

    if (!version) throw new NotFoundException('Version not found');

    await this.checkAccess(user, version.project.owner?.id);

    const data = await this.roiFieldValueRepo.find({
      where: { version: { id: versionId }, isActive: true },
      relations: ['field', 'version'],
      order: { id: 'DESC' },
    });

    return successResponse({
      message: 'ROI Field Values for version retrieved successfully',
      data,
    });
  }

  async update(
    id: number,
    dto: UpdateRoiFieldValueDto,
    user: any,
    ip?: string,
    userAgent?: string,
  ) {
    const userId = user.id;
    const entity = await this.roiFieldValueRepo.findOne({
      where: { id },
      relations: ['version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('ROI Field Value not found');
    }

    await this.checkAccess(user, entity.version.project.owner?.id);

    const oldValue = entity.valueNumeric;

    Object.assign(entity, dto);
    const updatedEntity = await this.roiFieldValueRepo.save(entity);

    // Ghi audit log cho việc cập nhật field value
    await this.auditService.logAudit({
      action: 'UPDATE',
      entityType: 'roi_field_value',
      entityId: id,
      userId: userId,
      ip,
      userAgent,
      changes: [
        {
          fieldCode: 'value_numeric',
          oldValue: oldValue,
          newValue: updatedEntity.valueNumeric,
        },
      ],
    });

    return updatedEntity;
  }

  async softDelete(id: number, user: any, ip?: string, userAgent?: string) {
    const userId = user.id;
    const entity = await this.roiFieldValueRepo.findOne({
      where: { id },
      relations: ['version', 'version.project', 'version.project.owner'],
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('ROI Field Value not found');
    }

    await this.checkAccess(user, entity.version.project.owner?.id);

    await this.roiFieldValueRepo.update(id, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId,
    });

    // Ghi audit log cho việc xóa field value
    await this.auditService.logAudit({
      action: 'DELETE',
      entityType: 'roi_field_value',
      entityId: id,
      userId: userId,
      ip,
      userAgent,
      changes: [
        {
          fieldCode: 'is_active',
          oldValue: true,
          newValue: false,
        },
      ],
    });

    return successResponse({
      message: 'ROI Field Value deleted successfully',
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
