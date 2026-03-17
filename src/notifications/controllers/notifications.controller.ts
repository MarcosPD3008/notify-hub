import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationDispatchService } from '../services/notification-dispatch.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { WhatsappSendDto } from '../dto/whatsapp-send.dto';

@ApiTags('Notifications')
@ApiExtraModels(WhatsappSendDto)
@Controller()
export class NotificationsController {
  constructor(private readonly dispatchService: NotificationDispatchService) {}

  @Post('send')
  @ApiOperation({ summary: 'Envia notificaciones por provider' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ status: 201, description: 'Mensaje enviado o encolado' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  async send(@Body() body: unknown): Promise<{ status: 'sent' | 'queued' }> {
    return this.dispatchService.dispatch(body);
  }
}
