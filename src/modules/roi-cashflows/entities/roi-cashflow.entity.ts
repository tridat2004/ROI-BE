import { RoiProjectVersion } from 'src/modules/roi-project-versions/entities/roi-project-version.entity';
import { RoiScenario } from 'src/modules/roi-scenarios/entities/roi-scenario.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('roi_cashflows')
@Index(['version', 'scenario', 'yearIndex'], { unique: true })
export class RoiCashflow {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => RoiProjectVersion)
  @JoinColumn({ name: 'version_id' })
  version: RoiProjectVersion;

  @ManyToOne(() => RoiScenario)
  @JoinColumn({ name: 'scenario_id' })
  scenario: RoiScenario;

  @Column({ name: 'year_index' })
  yearIndex: number;

  @Column({ type: 'decimal', nullable: true })
  savings: number;

  @Column({ type: 'decimal', nullable: true })
  costs: number;

  @Column({ type: 'decimal', nullable: true })
  net: number;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
