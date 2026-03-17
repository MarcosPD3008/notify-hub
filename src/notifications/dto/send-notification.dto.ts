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

  @ApiProperty({
    required: false,
    description: 'ISO 8601 datetime to schedule the send (must be in the future)',
    example: '2026-03-18T10:00:00.000Z',
  })
  scheduleTime?: Date;
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

  let scheduleTime: Date | undefined;
  if (payload.scheduleTime !== undefined && payload.scheduleTime !== null) {
    const parsed = new Date(payload.scheduleTime as string);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(
        'scheduleTime must be a valid ISO 8601 datetime string.',
      );
    }
    if (parsed.getTime() <= Date.now()) {
      throw new BadRequestException('scheduleTime must be a future datetime.');
    }
    scheduleTime = parsed;
  }

  return {
    provider: payload.provider,
    data: payload.data,
    scheduleTime,
  };
}
