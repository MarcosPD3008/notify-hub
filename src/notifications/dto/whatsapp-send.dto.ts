import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class WhatsappDocumentDto {
  @ApiProperty({ required: false, example: 'https://example.com/file.pdf' })
  url?: string;

  @ApiProperty({ required: false, description: 'Base64-encoded file content' })
  base64?: string;

  @ApiProperty({
    required: false,
    example: 'application/pdf',
    description: 'MIME type. Auto-detected from Content-Type when using a URL.',
  })
  mimetype?: string;

  @ApiProperty({ required: false, example: 'report.pdf' })
  filename?: string;

  @ApiProperty({ required: false, example: 'Check this file' })
  caption?: string;
}

export class WhatsappSendDto {
  @ApiProperty({ type: [String], example: ['1234', '5678'] })
  to!: string[];

  @ApiProperty({ required: false, example: 'Hola' })
  message?: string;

  @ApiProperty({ required: false, type: [WhatsappDocumentDto] })
  documents?: WhatsappDocumentDto[];
}

function parseDocument(
  item: unknown,
  index: number,
): WhatsappDocumentDto {
  if (typeof item !== 'object' || item === null) {
    throw new BadRequestException(
      `whatsapp.data.documents[${index}] must be an object.`,
    );
  }

  const doc = item as Record<string, unknown>;

  const hasUrl = typeof doc.url === 'string';
  const hasBase64 = typeof doc.base64 === 'string';

  if (hasBase64 && (typeof doc.mimetype !== 'string' || doc.mimetype.trim() === '')) {
    throw new BadRequestException(
      `whatsapp.data.documents[${index}].mimetype is required when using base64.`,
    );
  }

  if (!hasUrl && !hasBase64) {
    throw new BadRequestException(
      `whatsapp.data.documents[${index}] must have either url or base64.`,
    );
  }

  if (hasUrl && hasBase64) {
    throw new BadRequestException(
      `whatsapp.data.documents[${index}] must have url or base64, not both.`,
    );
  }

  if (hasUrl && !/^https?:\/\//i.test(doc.url as string)) {
    throw new BadRequestException(
      `whatsapp.data.documents[${index}].url must be a valid http/https URL.`,
    );
  }

  return {
    url: hasUrl ? (doc.url as string) : undefined,
    base64: hasBase64 ? (doc.base64 as string) : undefined,
    mimetype: doc.mimetype as string,
    filename: typeof doc.filename === 'string' ? doc.filename : undefined,
    caption: typeof doc.caption === 'string' ? doc.caption : undefined,
  };
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

  const hasMessage =
    payload.message !== undefined && payload.message !== null;
  const hasDocuments =
    Array.isArray(payload.documents) && payload.documents.length > 0;

  if (!hasMessage && !hasDocuments) {
    throw new BadRequestException(
      'whatsapp.data must have at least one of: message, documents.',
    );
  }

  if (hasMessage && typeof payload.message !== 'string') {
    throw new BadRequestException('whatsapp.data.message must be a string.');
  }

  const documents = hasDocuments
    ? (payload.documents as unknown[]).map((item, i) =>
        parseDocument(item, i),
      )
    : undefined;

  return {
    to: recipients.map((num) => num.replace(/\D/g, '')),
    message: hasMessage ? (payload.message as string) : undefined,
    documents,
  };
}
