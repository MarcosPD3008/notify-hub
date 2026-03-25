import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://my-service.example.com/hooks/notify' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['inbound.message', 'notification.failed'],
    description: 'Leave empty to subscribe to all events',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['whatsapp'],
    description: 'Leave empty to receive events from all channels',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  channels?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
