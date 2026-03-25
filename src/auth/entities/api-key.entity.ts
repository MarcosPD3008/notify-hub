import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ApiKeyRole {
  ADMIN = 'admin',
  SERVICE = 'service',
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  serviceId!: string;

  @Column({ select: false })
  keyHash!: string;

  @Column()
  keyPrefix!: string;

  @Column({ type: 'enum', enum: ApiKeyRole, default: ApiKeyRole.SERVICE })
  role!: ApiKeyRole;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
