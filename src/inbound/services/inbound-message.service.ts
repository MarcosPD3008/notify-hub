import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProviderFactoryService } from '../../notifications/services/provider-factory.service';
import { InboundMessage } from '../../notifications/providers/base-notification.provider';

export const INBOUND_QUEUE = 'inbound-queue';

@Injectable()
export class InboundMessageService implements OnModuleInit {
  private readonly logger = new Logger(InboundMessageService.name);

  constructor(
    private readonly providerFactory: ProviderFactoryService,
    @InjectQueue(INBOUND_QUEUE) private readonly inboundQueue: Queue,
  ) {}

  onModuleInit(): void {
    const all = this.providerFactory.getAll();
    this.logger.log(`Found ${all.length} provider(s): ${all.map(p => p.providerName).join(', ') || 'none'}`);
    for (const provider of all) {
      if (!provider.supportsInbound || !provider.onInboundMessage) continue;

      provider.onInboundMessage(async (msg: InboundMessage) => {
        await this.inboundQueue.add('inbound-message', msg, {
          removeOnComplete: 500,
          removeOnFail: 1000,
        });
        this.logger.debug(
          `Enqueued inbound message from ${msg.from} via ${msg.channel}`,
        );
      });

      this.logger.log(
        `Registered inbound handler for provider: ${provider.providerName}`,
      );
    }
  }
}
