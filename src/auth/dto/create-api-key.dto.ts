import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyRole } from '../entities/api-key.entity';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'CRM Integration' })
  name!: string;

  @ApiProperty({ example: 'crm' })
  serviceId!: string;

  @ApiProperty({ enum: ApiKeyRole, default: ApiKeyRole.SERVICE, required: false })
  role?: ApiKeyRole;

  @ApiProperty({
    required: false,
    description: 'ISO 8601 expiry date. Omit for no expiry.',
    example: '2027-01-01T00:00:00.000Z',
  })
  expiresAt?: Date;
}

export class ApiKeyCreatedDto {
  @ApiProperty({ description: 'The raw key — shown ONCE, store it securely.' })
  key!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  serviceId!: string;

  @ApiProperty({ enum: ApiKeyRole })
  role!: ApiKeyRole;

  @ApiProperty({ nullable: true })
  expiresAt!: Date | null;
}
