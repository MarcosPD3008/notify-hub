import { BadRequestException } from '@nestjs/common';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { WhatsappSendDto } from './whatsapp-send.dto';

export class SendNotificationDto {
  @ApiProperty({ description: 'Proveedor a usar', example: 'whatsapp' })
  provider!: string;

  @ApiProperty({
    description: 'Datos del mensaje según el proveedor',
    oneOf: [{ $ref: getSchemaPath(WhatsappSendDto) }],
  })
  data!: unknown;
}

export function parseSendNotificationDto(body: unknown): SendNotificationDto {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Body must be an object.');
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.provider !== 'string' || payload.provider.length === 0) {
    throw new BadRequestException(
      'provider is required and must be a non-empty string.',
    );
  }

  if (!Object.prototype.hasOwnProperty.call(payload, 'data')) {
    throw new BadRequestException('data is required.');
  }

  return {
    provider: payload.provider,
    data: payload.data,
  };
}
