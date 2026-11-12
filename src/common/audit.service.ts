import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../modules/audit-logs/entities/audit-log.entity';
import { AuditLogChange } from '../modules/audit-log-changes/entities/audit-log-change.entity';

export interface AuditData {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: number;
  userId: number;
  ip?: string;
  userAgent?: string;
  changes?: Array<{
    fieldCode: string;
    oldValue?: any;
    newValue?: any;
  }>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(AuditLogChange)
    private auditLogChangeRepo: Repository<AuditLogChange>,
  ) {}

  async logAudit(data: AuditData): Promise<void> {
    // Chỉ cho phép lưu log đối với 2 bảng này theo yêu cầu
    const allowedEntities = ['roi_project_version', 'roi_field_value'];
    if (!allowedEntities.includes(data.entityType)) {
      return;
    }

    const auditLog = this.auditLogRepo.create({
      actorUserId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      occurredAt: new Date(),
      ip: data.ip,
      userAgent: data.userAgent,
    });

    const savedAuditLog = await this.auditLogRepo.save(auditLog);

    if (data.changes && data.changes.length > 0) {
      const changes = data.changes.map((change) =>
        this.auditLogChangeRepo.create({
          auditLog: savedAuditLog,
          fieldCode: change.fieldCode,
          oldValue: change.oldValue,
          newValue: change.newValue,
        }),
      );

      await this.auditLogChangeRepo.save(changes);
    }
  }
}
