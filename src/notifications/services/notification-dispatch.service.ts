import { BadRequestException, Injectable } from '@nestjs/common';
import { parseSendNotificationDto } from '../dto/send-notification.dto';
import { ProviderFactoryService } from './provider-factory.service';
import { QueueFactoryService } from './queue-factory.service';

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly providerFactory: ProviderFactoryService,
    private readonly queueFactory: QueueFactoryService,
  ) {}

  async dispatch(body: unknown): Promise<{ status: 'sent' | 'queued' }> {
    const dto = parseSendNotificationDto(body);
    const provider = this.providerFactory.get(dto.provider);

    if (!provider) {
      throw new BadRequestException(
        `Provider '${dto.provider}' is not registered.`,
      );
    }

    // Get specialized or fallback queue dynamically avoiding hardcoded injections
    const targetQueue = this.queueFactory.getQueue(dto.provider);

    // Read Retry configuration from Env variables with sensible defaults
    const attempts = parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10);
    const delay = parseInt(process.env.QUEUE_DEFAULT_BACKOFF_MS || '5000', 10);
    const type = (process.env.QUEUE_DEFAULT_BACKOFF_TYPE || 'exponential') as
      | 'fixed'
      | 'exponential';

    const jobDelay = dto.scheduleTime
      ? dto.scheduleTime.getTime() - Date.now()
      : undefined;

    await targetQueue.add(
      'send-message',
      {
        provider: dto.provider,
        payload: dto.data,
      },
      {
        attempts,
        backoff: {
          type,
          delay,
        },
        ...(jobDelay !== undefined && { delay: jobDelay }),
      },
    );

    return { status: 'queued' };
  }
}
