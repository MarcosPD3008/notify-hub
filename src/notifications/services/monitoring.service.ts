import { Injectable, Logger } from '@nestjs/common';
import { ProviderStateService } from './provider-state.service';
import { NotificationDispatchService } from './notification-dispatch.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly providerStateService: ProviderStateService,
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

  async checkWhatsAppStatus(): Promise<void> {
    const whatsappState = this.providerStateService.getSnapshot('whatsapp');

    if (
      whatsappState.status === 'DISCONNECTED' ||
      whatsappState.status === 'CONFLICT'
    ) {
      this.logger.warn(
        `WhatsApp channel is in a critical state: ${whatsappState.status}`,
      );

      const emailNotification = {
        provider: 'email',
        data: {
          to: [process.env.ADMIN_EMAIL],
          subject: 'WhatsApp Channel Alert',
          body: `The WhatsApp channel is in a critical state: ${whatsappState.status}. Immediate attention is required.`,
        },
      };

      try {
        await this.notificationDispatchService.dispatch(emailNotification);
        this.logger.log('Email alert sent to admin.');
      } catch (error) {
        this.logger.error('Failed to send email alert.', error);
      }
    }
  }
}
