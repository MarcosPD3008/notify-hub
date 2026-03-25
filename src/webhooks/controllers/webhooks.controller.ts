import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WebhooksService } from '../services/webhooks.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { ApiKey } from '../../auth/entities/api-key.entity';
import { CurrentApiKey } from '../../auth/decorators/current-api-key.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Register a webhook subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created. Secret is shown only once.' })
  async create(
    @Body() dto: CreateWebhookDto,
    @CurrentApiKey() apiKey: ApiKey,
  ) {
    return this.webhooksService.create(apiKey.serviceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List webhook subscriptions for the calling service' })
  async findAll(@CurrentApiKey() apiKey: ApiKey) {
    return this.webhooksService.findAll(apiKey.serviceId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a webhook subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  async revoke(
    @Param('id') id: string,
    @CurrentApiKey() apiKey: ApiKey,
  ): Promise<void> {
    await this.webhooksService.revoke(apiKey.serviceId, id);
  }
}
