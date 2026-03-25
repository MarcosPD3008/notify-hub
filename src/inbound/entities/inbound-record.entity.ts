import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('inbound_records')
export class InboundRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** e.g. 'whatsapp' */
  @Column()
  channel!: string;

  /** Sender identifier (JID, email, etc.) */
  @Column()
  from!: string;

  /** Our side recipient identifier */
  @Column()
  to!: string;

  @Column({ type: 'text', nullable: true })
  text!: string | null;

  /** Raw provider payload */
  @Column({ type: 'jsonb' })
  raw!: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  receivedAt!: Date;

  /** serviceId of the webhook subscriber that was notified, if any */
  @Column({ type: 'varchar', nullable: true })
  serviceId!: string | null;
}
