import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationRecord } from './notification-record.entity';

@Entity('delivery_attempts')
@Index(['jobId', 'attemptNumber'], { unique: true })
export class DeliveryAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => NotificationRecord, (n) => n.attempts, {
    onDelete: 'CASCADE',
  })
  notificationRecord!: NotificationRecord;

  @Column()
  notificationRecordId!: string;

  @Column()
  attemptNumber!: number;

  @Column()
  jobId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'boolean', nullable: true })
  success!: boolean | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;
}
