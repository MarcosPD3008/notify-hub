import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRecord } from './entities/notification-record.entity';
import { DeliveryAttempt } from './entities/delivery-attempt.entity';
import { ApiKey } from '../auth/entities/api-key.entity';
import { InboundRecord } from '../inbound/entities/inbound-record.entity';
import { WebhookSubscription } from '../webhooks/entities/webhook-subscription.entity';
import { WebhookDelivery } from '../webhooks/entities/webhook-delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [NotificationRecord, DeliveryAttempt, ApiKey, InboundRecord, WebhookSubscription, WebhookDelivery],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
