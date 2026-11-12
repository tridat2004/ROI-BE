import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Index('UQ_projectName_isActive', ['projectName'], { unique: true, where: '"is_active" = true' })
@Entity('roi_projects')
export class RoiProject {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column()
  projectName: string;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column()
  industry: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @Column()
  status: string;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'locked_by' })
  lockedBy: User;

  @Column({ name: 'current_version_id', nullable: true })
  currentVersionId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
