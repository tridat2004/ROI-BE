import { RoiProjectVersion } from 'src/modules/roi-project-versions/entities/roi-project-version.entity';
import { RoiScenario } from 'src/modules/roi-scenarios/entities/roi-scenario.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('roi_chart_points')
export class RoiChartPoint {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => RoiProjectVersion)
  @JoinColumn({ name: 'version_id' })
  version: RoiProjectVersion;

  @ManyToOne(() => RoiScenario)
  @JoinColumn({ name: 'scenario_id' })
  scenario: RoiScenario;

  @Column({ name: 'chart_code' })
  chartCode: string;

  @Column({ name: 'x_key' })
  xKey: string;

  @Column({
    name: 'y_value',
    type: 'decimal',
    nullable: true,
  })
  yValue: number;

  @Column({ type: 'json', nullable: true })
  meta: any;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
