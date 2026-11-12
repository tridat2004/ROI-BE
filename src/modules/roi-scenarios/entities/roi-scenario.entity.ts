import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roi_scenarios')
export class RoiScenario {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    name: 'default_workforce_reduction',
    type: 'decimal',
    nullable: true,
  })
  defaultWorkforceReduction: number;
}
