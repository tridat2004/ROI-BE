import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('activity_log')
export class ActivityLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  username: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  status: string;

  @CreateDateColumn({ name: 'create_at', type: 'timestamptz' })
  createAt: Date;

  @Column({ name: 'desc', type: 'text', nullable: true })
  desc: string;
}
