import { Body, Controller, Headers, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  ApiBody,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { NotificationDispatchService } from '../services/notification-dispatch.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { WhatsappSendDto } from '../dto/whatsapp-send.dto';
import { CurrentApiKey } from '../../auth/decorators/current-api-key.decorator';
import { ApiKey } from '../../auth/entities/api-key.entity';

@ApiTags('Notifications')
@ApiSecurity('X-Api-Key')
@ApiExtraModels(WhatsappSendDto)
@Controller()
export class NotificationsController {
  constructor(private readonly dispatchService: NotificationDispatchService) {}

  @Post('send')
  @ApiOperation({ summary: 'Enqueue a notification through any registered provider' })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    required: false,
    description: 'Unique key to prevent duplicate sends on network retries (24h TTL)',
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notification queued',
    schema: {
      example: { status: 'queued', notificationId: 'uuid-here' },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key' })
  async send(
    @Body() body: unknown,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @CurrentApiKey() apiKey: ApiKey,
  ): Promise<{ status: 'queued'; notificationId: string }> {
    return this.dispatchService.dispatch(body, {
      serviceId: apiKey.serviceId,
      idempotencyKey: idempotencyKey || undefined,
    });
  }
}
