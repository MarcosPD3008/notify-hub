import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { InboundModule } from './inbound/inbound.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    RedisModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    DatabaseModule,
    AuthModule,
    NotificationsModule,
    InboundModule,
    WebhooksModule,
  ],
})
export class AppModule {}
