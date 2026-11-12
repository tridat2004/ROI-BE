import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../modules/audit-logs/entities/audit-log.entity';
import { AuditLogChange } from '../modules/audit-log-changes/entities/audit-log-change.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, AuditLogChange])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
