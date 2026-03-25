import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './controllers/health.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { WhatsappController } from './controllers/whatsapp.controller';
import { NotificationProcessor } from './processors/notification.processor';
import { WhatsappProcessor } from './processors/whatsapp.processor';
import { WhatsappAdapter } from './providers/whatsapp.adapter';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import {
  ProviderFactoryService,
  NOTIFICATION_PROVIDER,
} from './services/provider-factory.service';
import { ProviderStateService } from './services/provider-state.service';
import { QueueFactoryService } from './services/queue-factory.service';
import { JobLifecycleService } from './services/job-lifecycle.service';
import { NotificationRecord } from '../database/entities/notification-record.entity';
import { DeliveryAttempt } from '../database/entities/delivery-attempt.entity';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications-queue' },
      { name: 'whatsapp-queue' },
    ),
    TypeOrmModule.forFeature([NotificationRecord, DeliveryAttempt]),
  ],
  controllers: [HealthController, WhatsappController, NotificationsController],
  providers: [
    ProviderStateService,
    WhatsappAdapter,
    {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (adapter: WhatsappAdapter) => [adapter],
      inject: [WhatsappAdapter],
    },
    ProviderFactoryService,
    QueueFactoryService,
    NotificationDispatchService,
    JobLifecycleService,
    NotificationProcessor,
    WhatsappProcessor,
  ],
  exports: [ProviderFactoryService],
})
export class NotificationsModule {}
