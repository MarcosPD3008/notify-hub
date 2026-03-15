import { Controller, Get } from '@nestjs/common';
import { ProviderFactoryService } from '../services/provider-factory.service';

@Controller('health')
export class HealthController {
  constructor(private readonly providerFactory: ProviderFactoryService) {}

  @Get()
  check(): {
    status: 'up';
    providers: Record<
      string,
      { status: 'CONNECTED' | 'WAITING_QR'; latency: string }
    >;
  } {
    const providers = this.providerFactory.getAll().reduce(
      (accumulator, provider) => {
        accumulator[provider.providerName] = provider.getHealth();
        return accumulator;
      },
      {} as Record<
        string,
        { status: 'CONNECTED' | 'WAITING_QR'; latency: string }
      >,
    );

    return {
      status: 'up',
      providers,
    };
  }
}
