import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProviderFactoryService } from '../services/provider-factory.service';
import { ChannelStatus } from '../providers/base-notification.provider';
import { Public } from '../../auth/decorators/public.decorator';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly providerFactory: ProviderFactoryService) {}

  @Get()
  @ApiOperation({ summary: 'Healthcheck del servicio' })
  @ApiResponse({ status: 200, description: 'Estado del servicio y proveedores' })
  check(): { status: 'up'; providers: Record<string, { status: ChannelStatus }> } {
    const providers = this.providerFactory.getAll().reduce(
      (acc, provider) => {
        acc[provider.providerName] = { status: provider.getChannelStatus() };
        return acc;
      },
      {} as Record<string, { status: ChannelStatus }>,
    );

    return { status: 'up', providers };
  }
}
