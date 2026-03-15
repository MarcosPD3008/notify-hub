import { BadRequestException, Injectable } from '@nestjs/common';
import { parseSendNotificationDto } from '../dto/send-notification.dto';
import { ProviderFactoryService } from './provider-factory.service';

@Injectable()
export class NotificationDispatchService {
  constructor(private readonly providerFactory: ProviderFactoryService) {}

  async dispatch(body: unknown): Promise<{ status: 'sent' }> {
    const dto = parseSendNotificationDto(body);
    const provider = this.providerFactory.get(dto.provider);

    if (!provider) {
      throw new BadRequestException(
        `Provider '${dto.provider}' is not registered.`,
      );
    }

    await provider.send(dto.data);

    return { status: 'sent' };
  }
}
