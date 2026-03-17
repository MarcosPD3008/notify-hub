import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProviderFactoryService } from '../services/provider-factory.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly providerFactory: ProviderFactoryService) {}

  @Get()
  @ApiOperation({ summary: 'Healthcheck del servicio' })
  @ApiResponse({
    status: 200,
    description: 'Estado del servicio y proveedores',
  })
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
