import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappAdapter } from './providers/whatsapp.adapter';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import { ProviderFactoryService } from './services/provider-factory.service';
import { ProviderStateService } from './services/provider-state.service';

@Module({
  controllers: [HealthController, WhatsappController, NotificationsController],
  providers: [
    ProviderStateService,
    WhatsappAdapter,
    ProviderFactoryService,
    NotificationDispatchService,
  ],
})
export class NotificationsModule {}
