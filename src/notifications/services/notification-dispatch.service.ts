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

    await targetQueue.add('send-message', {
      provider: dto.provider,
      payload: dto.data,
    });

    return { status: 'queued' };
  }
}
