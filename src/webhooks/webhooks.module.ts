import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhooksService, WEBHOOK_DELIVERY_QUEUE } from './services/webhooks.service';
import { WebhookEventListenerService } from './services/webhook-event-listener.service';
import { WebhookDeliveryProcessor } from './processors/webhook-delivery.processor';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: WEBHOOK_DELIVERY_QUEUE }),
    TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery]),
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookEventListenerService,
    WebhookDeliveryProcessor,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
