import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WebhookSubscription } from './webhook-subscription.entity';

export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('webhook_deliveries')
@Index(['subscriptionId', 'createdAt'])
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => WebhookSubscription, (s) => s.deliveries, {
    onDelete: 'CASCADE',
  })
  subscription!: WebhookSubscription;

  @Column()
  subscriptionId!: string;

  @Column()
  eventType!: string;

  /** Serialized payload sent to the subscriber */
  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  status!: WebhookDeliveryStatus;

  @Column({ type: 'int', nullable: true })
  responseStatus!: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ default: 0 })
  attemptCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;
}
