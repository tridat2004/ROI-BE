import { RoiProject } from 'src/modules/roi-projects/entities/roi-project.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('roi_project_versions')
export class RoiProjectVersion {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => RoiProject)
  @JoinColumn({ name: 'project_id' })
  project: RoiProject;

  @Column({ name: 'version_no' })
  versionNo: number;

  @Column()
  title: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'is_locked_snapshot' })
  isLockedSnapshot: boolean;

  @Column({ name: 'calculation_model_version' })
  calculationModelVersion: string;

  @Column()
  status: string;

  // soft delete
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
