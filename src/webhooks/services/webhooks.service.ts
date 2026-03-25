import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';
import { WebhookDelivery, WebhookDeliveryStatus } from '../entities/webhook-delivery.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';

export const WEBHOOK_DELIVERY_QUEUE = 'webhook-delivery-queue';

export interface WebhookEventPayload {
  eventType: string;
  channel?: string;
  data: unknown;
  occurredAt: string;
}

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subRepo: Repository<WebhookSubscription>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: Repository<WebhookDelivery>,
    @InjectQueue(WEBHOOK_DELIVERY_QUEUE)
    private readonly deliveryQueue: Queue,
  ) {}

  async create(serviceId: string, dto: CreateWebhookDto): Promise<WebhookSubscription> {
    const secret = randomBytes(32).toString('hex');
    const sub = this.subRepo.create({
      serviceId,
      url: dto.url,
      secret,
      events: dto.events ?? [],
      channels: dto.channels ?? [],
      isActive: dto.isActive ?? true,
    });
    return this.subRepo.save(sub);
  }

  async findAll(serviceId: string): Promise<WebhookSubscription[]> {
    return this.subRepo.find({ where: { serviceId } });
  }

  async revoke(serviceId: string, id: string): Promise<void> {
    await this.subRepo.update({ id, serviceId }, { isActive: false });
  }

  async dispatch(event: WebhookEventPayload): Promise<void> {
    const subscribers = await this.subRepo.find({ where: { isActive: true } });

    for (const sub of subscribers) {
      const eventMatch =
        sub.events.length === 0 || sub.events.includes(event.eventType);
      const channelMatch =
        !event.channel ||
        sub.channels.length === 0 ||
        sub.channels.includes(event.channel);

      if (!eventMatch || !channelMatch) continue;

      const delivery = await this.deliveryRepo.save(
        this.deliveryRepo.create({
          subscriptionId: sub.id,
          eventType: event.eventType,
          payload: event,
          status: WebhookDeliveryStatus.PENDING,
          responseStatus: null,
          errorMessage: null,
          attemptCount: 0,
          deliveredAt: null,
        }),
      );

      await this.deliveryQueue.add(
        'deliver',
        { deliveryId: delivery.id, subscriptionId: sub.id },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 500,
          removeOnFail: 1000,
        },
      );
    }
  }
}
