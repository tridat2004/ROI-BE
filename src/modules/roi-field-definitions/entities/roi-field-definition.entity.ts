import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roi_field_definitions')
export class RoiFieldDefinition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  group: string;

  @Column({ name: 'data_type' })
  dataType: string;

  @Column({ name: 'is_required' })
  isRequired: boolean;

  @Column({ name: 'default_value', type: 'json', nullable: true })
  defaultValue: any;

  @Column({ name: 'min_value', type: 'decimal', nullable: true })
  minValue: number;

  @Column({ name: 'max_value', type: 'decimal', nullable: true })
  maxValue: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', nullable: true })
  sortOrder: number;
}
