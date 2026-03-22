import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './controllers/health.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { WhatsappController } from './controllers/whatsapp.controller';
import { NotificationProcessor } from './processors/notification.processor';
import { WhatsappProcessor } from './processors/whatsapp.processor';
import { WhatsappAdapter } from './providers/whatsapp.adapter';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import { ProviderFactoryService } from './services/provider-factory.service';
import { ProviderStateService } from './services/provider-state.service';
import { QueueFactoryService } from './services/queue-factory.service';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'notifications-queue',
      },
      {
        name: 'whatsapp-queue',
      },
    ),
  ],
  controllers: [HealthController, WhatsappController, NotificationsController],
  providers: [
    ProviderStateService,
    WhatsappAdapter,
    ProviderFactoryService,
    QueueFactoryService,
    NotificationDispatchService,
    NotificationProcessor,
    WhatsappProcessor,
    EmailService,
  ],
})
export class NotificationsModule {}
