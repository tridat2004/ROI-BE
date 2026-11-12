import { RoiProjectVersion } from 'src/modules/roi-project-versions/entities/roi-project-version.entity';
import { RoiScenario } from 'src/modules/roi-scenarios/entities/roi-scenario.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('roi_metrics')
@Index(['version', 'scenario', 'metricCode'], { unique: true })
export class RoiMetric {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => RoiProjectVersion)
  @JoinColumn({ name: 'version_id' })
  version: RoiProjectVersion;

  @ManyToOne(() => RoiScenario)
  @JoinColumn({ name: 'scenario_id' })
  scenario: RoiScenario;

  @Column({ name: 'metric_code' })
  metricCode: string;

  @Column({
    name: 'value_numeric',
    type: 'decimal',
    nullable: true,
  })
  valueNumeric: number;

  @Column({
    name: 'value_text',
    type: 'text',
    nullable: true,
  })
  valueText: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
