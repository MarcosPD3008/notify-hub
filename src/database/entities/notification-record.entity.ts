import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliveryAttempt } from './delivery-attempt.entity';

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('notification_records')
export class NotificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  channel!: string;

  @Column()
  serviceId!: string;

  @Column({ type: 'jsonb' })
  recipients!: string[];

  @Column({ type: 'jsonb' })
  payloadSnapshot!: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true, unique: true })
  idempotencyKey!: string | null;

  @Column({ type: 'varchar', nullable: true })
  jobId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduleTime!: Date | null;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.QUEUED,
  })
  status!: NotificationStatus;

  @OneToMany(() => DeliveryAttempt, (a) => a.notificationRecord)
  attempts!: DeliveryAttempt[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
