import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'node:crypto';
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
} from '../entities/webhook-delivery.entity';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';
import { WEBHOOK_DELIVERY_QUEUE } from '../services/webhooks.service';

interface DeliverJobData {
  deliveryId: string;
  subscriptionId: string;
}

@Processor(WEBHOOK_DELIVERY_QUEUE)
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: Repository<WebhookDelivery>,
    @InjectRepository(WebhookSubscription)
    private readonly subRepo: Repository<WebhookSubscription>,
  ) {
    super();
  }

  async process(job: Job<DeliverJobData>): Promise<void> {
    const { deliveryId, subscriptionId } = job.data;

    const [delivery, sub] = await Promise.all([
      this.deliveryRepo.findOneOrFail({ where: { id: deliveryId } }),
      this.subRepo
        .createQueryBuilder('s')
        .addSelect('s.secret')
        .where('s.id = :id', { id: subscriptionId })
        .getOneOrFail(),
    ]);

    const body = JSON.stringify(delivery.payload);
    const signature = createHmac('sha256', sub.secret)
      .update(body)
      .digest('hex');

    let responseStatus: number | null = null;
    let errorMessage: string | null = null;
    let status = WebhookDeliveryStatus.FAILED;

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
          'X-Hub-Event': delivery.eventType,
          'X-Hub-Delivery': delivery.id,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      responseStatus = res.status;

      if (res.ok) {
        status = WebhookDeliveryStatus.SUCCESS;
      } else {
        errorMessage = `HTTP ${res.status}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      errorMessage = errorMessage ?? String(err);
      this.logger.warn(
        `Webhook delivery ${deliveryId} attempt ${job.attemptsMade + 1} failed: ${errorMessage}`,
      );
      throw err; // BullMQ will retry
    } finally {
      await this.deliveryRepo.update(deliveryId, {
        status,
        responseStatus,
        errorMessage,
        attemptCount: job.attemptsMade + 1,
        deliveredAt: status === WebhookDeliveryStatus.SUCCESS ? new Date() : null,
      });
    }
  }
}
