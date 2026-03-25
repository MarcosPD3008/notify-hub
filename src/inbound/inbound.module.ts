import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundRecord } from './entities/inbound-record.entity';
import { InboundMessageService, INBOUND_QUEUE } from './services/inbound-message.service';
import { InboundSseService } from './services/inbound-sse.service';
import { InboundProcessor } from './processors/inbound.processor';
import { InboundEventsController } from './controllers/inbound-events.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: INBOUND_QUEUE }),
    TypeOrmModule.forFeature([InboundRecord]),
    NotificationsModule,
  ],
  controllers: [InboundEventsController],
  providers: [InboundMessageService, InboundSseService, InboundProcessor],
})
export class InboundModule {}
