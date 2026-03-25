import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { parseSendNotificationDto } from '../dto/send-notification.dto';
import { ProviderFactoryService } from './provider-factory.service';
import { QueueFactoryService } from './queue-factory.service';
import { NotificationRecord, NotificationStatus } from '../../database/entities/notification-record.entity';
import { REDIS_CLIENT } from '../../redis/redis.module';

const IDEMPOTENCY_TTL_SECONDS = 86_400; // 24 h

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly providerFactory: ProviderFactoryService,
    private readonly queueFactory: QueueFactoryService,
    @InjectRepository(NotificationRecord)
    private readonly notifRepo: Repository<NotificationRecord>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async dispatch(
    body: unknown,
    context: { serviceId: string; idempotencyKey?: string },
  ): Promise<{ status: 'queued'; notificationId: string }> {
    const dto = parseSendNotificationDto(body);
    const provider = this.providerFactory.get(dto.provider);

    if (!provider) {
      throw new BadRequestException(
        `Provider '${dto.provider}' is not registered.`,
      );
    }

    // ── Idempotency check ───────────────────────────────────────────────────
    if (context.idempotencyKey) {
      const cached = await this.redis.get(
        `idempotency:${context.idempotencyKey}`,
      );
      if (cached) {
        this.logger.debug(
          `Idempotency hit for key ${context.idempotencyKey} → ${cached}`,
        );
        return { status: 'queued', notificationId: cached };
      }
    }

    // ── Persist the notification record ────────────────────────────────────
    const record = await this.notifRepo.save(
      this.notifRepo.create({
        channel: dto.provider,
        serviceId: context.serviceId,
        recipients: this.extractRecipients(dto.data),
        payloadSnapshot: dto.data as Record<string, unknown>,
        idempotencyKey: context.idempotencyKey ?? null,
        scheduleTime: dto.scheduleTime ?? null,
        status: NotificationStatus.QUEUED,
      }),
    );

    // ── Enqueue ─────────────────────────────────────────────────────────────
    const targetQueue = this.queueFactory.getQueue(dto.provider);

    const attempts = parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10);
    const backoffDelay = parseInt(
      process.env.QUEUE_DEFAULT_BACKOFF_MS || '5000',
      10,
    );
    const backoffType = (
      process.env.QUEUE_DEFAULT_BACKOFF_TYPE || 'exponential'
    ) as 'fixed' | 'exponential';

    const jobDelay = dto.scheduleTime
      ? dto.scheduleTime.getTime() - Date.now()
      : undefined;

    const job = await targetQueue.add(
      'send-message',
      {
        provider: dto.provider,
        payload: dto.data,
        notificationRecordId: record.id,
      },
      {
        attempts,
        backoff: { type: backoffType, delay: backoffDelay },
        ...(jobDelay !== undefined && { delay: jobDelay }),
        // Idempotency key also acts as BullMQ jobId to prevent duplicate jobs
        ...(context.idempotencyKey && { jobId: context.idempotencyKey }),
      },
    );

    // Store jobId on the record for traceability
    await this.notifRepo.update(record.id, { jobId: String(job.id) });

    // ── Cache idempotency key ───────────────────────────────────────────────
    if (context.idempotencyKey) {
      await this.redis.set(
        `idempotency:${context.idempotencyKey}`,
        record.id,
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
      );
    }

    return { status: 'queued', notificationId: record.id };
  }

  private extractRecipients(data: unknown): string[] {
    if (
      typeof data === 'object' &&
      data !== null &&
      'to' in data &&
      Array.isArray((data as Record<string, unknown>).to)
    ) {
      return (data as { to: unknown[] }).to.map(String);
    }
    return [];
  }
}
