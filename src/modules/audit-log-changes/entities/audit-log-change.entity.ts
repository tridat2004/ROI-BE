import { AuditLog } from 'src/modules/audit-logs/entities/audit-log.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('audit_log_changes')
export class AuditLogChange {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => AuditLog)
  @JoinColumn({ name: 'audit_log_id' })
  auditLog: AuditLog;

  @Column({ name: 'field_code' })
  fieldCode: string;

  @Column({ name: 'old_value', type: 'json', nullable: true })
  oldValue: any;

  @Column({ name: 'new_value', type: 'json', nullable: true })
  newValue: any;
}
