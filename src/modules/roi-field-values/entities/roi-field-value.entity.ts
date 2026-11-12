import { RoiFieldDefinition } from 'src/modules/roi-field-definitions/entities/roi-field-definition.entity';
import { RoiProjectVersion } from 'src/modules/roi-project-versions/entities/roi-project-version.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('roi_field_values')
export class RoiFieldValue {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => RoiProjectVersion)
  @JoinColumn({ name: 'version_id' })
  version: RoiProjectVersion;

  @ManyToOne(() => RoiFieldDefinition)
  @JoinColumn({ name: 'field_id' })
  field: RoiFieldDefinition;

  @Column({ name: 'value_numeric', type: 'decimal', nullable: true })
  valueNumeric: number;

  @Column({ name: 'value_text', type: 'text', nullable: true })
  valueText: string;

  @Column({ name: 'value_bool', nullable: true })
  valueBool: boolean;

  @Column({ name: 'value_json', type: 'json', nullable: true })
  valueJson: any;

  @Column({ name: 'is_estimated', nullable: true })
  isEstimated: boolean;

  @Column({ name: 'source', nullable: true })
  source: string;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
