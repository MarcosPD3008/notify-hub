import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseNotificationProvider } from '../providers/base-notification.provider';
import { WhatsappAdapter } from '../providers/whatsapp.adapter';

@Injectable()
export class ProviderFactoryService implements OnModuleInit {
  private readonly providers = new Map<string, BaseNotificationProvider>();

  constructor(private readonly whatsappAdapter: WhatsappAdapter) {}

  onModuleInit(): void {
    this.register(this.whatsappAdapter);
  }

  register(provider: BaseNotificationProvider): void {
    this.providers.set(provider.providerName, provider);
  }

  get(providerName: string): BaseNotificationProvider | undefined {
    return this.providers.get(providerName);
  }

  getAll(): BaseNotificationProvider[] {
    return [...this.providers.values()];
  }
}
