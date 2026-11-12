import { Module } from '@nestjs/common';
import { AuditLogChangesService } from './audit-log-changes.service';
import { AuditLogChangesController } from './audit-log-changes.controller';
import { AuditLogChange } from './entities/audit-log-change.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogChange, UserRole])],
  controllers: [AuditLogChangesController],
  providers: [AuditLogChangesService],
  exports: [AuditLogChangesService],
})
export class AuditLogChangesModule {}
