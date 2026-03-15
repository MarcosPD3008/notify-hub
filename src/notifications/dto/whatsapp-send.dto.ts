import { BadRequestException } from '@nestjs/common';

export interface WhatsappSendDto {
  to: string[];
  message: string;
}

export function parseWhatsappSendDto(data: unknown): WhatsappSendDto {
  if (typeof data !== 'object' || data === null) {
    throw new BadRequestException(
      'data must be an object for whatsapp provider.',
    );
  }

  const payload = data as Record<string, unknown>;

  if (!Array.isArray(payload.to)) {
    throw new BadRequestException(
      'whatsapp.data.to must be an array of strings.',
    );
  }

  const recipients = payload.to.filter(
    (item): item is string => typeof item === 'string',
  );
  if (recipients.length !== payload.to.length) {
    throw new BadRequestException(
      'whatsapp.data.to must be an array of strings.',
    );
  }

  if (typeof payload.message !== 'string') {
    throw new BadRequestException('whatsapp.data.message must be a string.');
  }

  return {
    to: recipients,
    message: payload.message,
  };
}
