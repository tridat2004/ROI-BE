import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ name: 'company_name', nullable: true, type: 'varchar' })
  companyName?: string | null;

  @Column({ name: 'phone', nullable: true, type: 'varchar' })
  phone?: string | null;

  @Column({ name: 'password_hash', nullable: true, type: 'varchar' })
  passwordHash: string | null;

  @Column({ nullable: true })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'create_by_id', type: 'bigint', nullable: true })
  createById: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'create_by_id' })
  createBy: User;

  @Column({ nullable: true, default: 'local', type: 'varchar' })
  provider: string;

  @OneToMany(() => ActivityLog, (activityLog) => activityLog.user)
  activityLogs: ActivityLog[];
}
