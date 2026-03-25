import { Inject, Injectable, Optional } from '@nestjs/common';
import { BaseNotificationProvider } from '../providers/base-notification.provider';

export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';

@Injectable()
export class ProviderFactoryService {
  private readonly providers = new Map<string, BaseNotificationProvider>();

  constructor(
    @Optional()
    @Inject(NOTIFICATION_PROVIDER)
    providers: BaseNotificationProvider | BaseNotificationProvider[],
  ) {
    if (!providers) return;
    const list = Array.isArray(providers) ? providers : [providers];
    for (const p of list) {
      this.providers.set(p.providerName, p);
    }
  }

  get(providerName: string): BaseNotificationProvider | undefined {
    return this.providers.get(providerName);
  }

  getAll(): BaseNotificationProvider[] {
    return [...this.providers.values()];
  }
}
