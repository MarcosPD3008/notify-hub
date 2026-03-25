import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InboundRecord } from '../../inbound/entities/inbound-record.entity';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class WebhookEventListenerService {
  private readonly logger = new Logger(WebhookEventListenerService.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @OnEvent('inbound.message')
  async onInboundMessage(record: InboundRecord): Promise<void> {
    try {
      await this.webhooksService.dispatch({
        eventType: 'inbound.message',
        channel: record.channel,
        data: {
          id: record.id,
          channel: record.channel,
          from: record.from,
          to: record.to,
          text: record.text,
          receivedAt: record.receivedAt,
        },
        occurredAt: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.error(`Webhook dispatch error: ${String(err)}`);
    }
  }
}
