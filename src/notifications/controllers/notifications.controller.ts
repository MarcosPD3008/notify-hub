import { Body, Controller, Post } from '@nestjs/common';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

@Controller()
export class NotificationsController {
  constructor(private readonly dispatchService: NotificationDispatchService) {}

  @Post('send')
  async send(@Body() body: unknown): Promise<{ status: 'sent' }> {
    return this.dispatchService.dispatch(body);
  }
}
