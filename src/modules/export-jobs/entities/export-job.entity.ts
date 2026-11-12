import { RoiProjectVersion } from 'src/modules/roi-project-versions/entities/roi-project-version.entity';
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

@Entity('export_jobs')
export class ExportJob {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => RoiProject)
  @JoinColumn({ name: 'project_id' })
  project: RoiProject;

  @ManyToOne(() => RoiProjectVersion)
  @JoinColumn({ name: 'version_id' })
  version: RoiProjectVersion;

  @Column({ name: 'export_type' })
  exportType: string;

  @Column()
  status: string;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
