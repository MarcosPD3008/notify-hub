import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WebhookDelivery } from './webhook-delivery.entity';

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Owner service — must match apiKey.serviceId */
  @Column()
  serviceId!: string;

  @Column()
  url!: string;

  /** HMAC-SHA256 signing secret */
  @Column({ select: false })
  secret!: string;

  /**
   * Event types to deliver, e.g. ['inbound.message', 'notification.failed'].
   * Empty array = subscribe to all events.
   */
  @Column({ type: 'jsonb', default: [] })
  events!: string[];

  /**
   * Channels to filter by, e.g. ['whatsapp', 'email'].
   * Empty array = all channels.
   */
  @Column({ type: 'jsonb', default: [] })
  channels!: string[];

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => WebhookDelivery, (d) => d.subscription)
  deliveries!: WebhookDelivery[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
