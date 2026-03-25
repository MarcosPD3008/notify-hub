import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import {
  DeliveryAttempt,
} from '../../database/entities/delivery-attempt.entity';
import {
  NotificationRecord,
  NotificationStatus,
} from '../../database/entities/notification-record.entity';

/** Shared lifecycle logic injected into every queue processor. */
@Injectable()
export class JobLifecycleService {
  private readonly logger = new Logger(JobLifecycleService.name);

  constructor(
    @InjectRepository(NotificationRecord)
    private readonly notifRepo: Repository<NotificationRecord>,
    @InjectRepository(DeliveryAttempt)
    private readonly attemptRepo: Repository<DeliveryAttempt>,
  ) {}

  async onActive(job: Job): Promise<void> {
    const notificationRecordId = this.extractRecordId(job);
    if (!notificationRecordId) return;

    await this.attemptRepo.insert({
      notificationRecordId,
      attemptNumber: (job.attemptsMade ?? 0) + 1,
      jobId: String(job.id),
      success: null,
      completedAt: null,
      errorMessage: null,
    });
  }

  async onCompleted(job: Job): Promise<void> {
    const notificationRecordId = this.extractRecordId(job);
    if (!notificationRecordId) return;

    await this.attemptRepo
      .createQueryBuilder()
      .update()
      .set({ completedAt: new Date(), success: true })
      .where('"jobId" = :jobId AND success IS NULL', { jobId: String(job.id) })
      .execute();

    await this.notifRepo.update(notificationRecordId, {
      status: NotificationStatus.DELIVERED,
    });
  }

  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    const notificationRecordId = this.extractRecordId(job);
    if (!notificationRecordId || !job) return;

    await this.attemptRepo
      .createQueryBuilder()
      .update()
      .set({
        completedAt: new Date(),
        success: false,
        errorMessage: error.message.substring(0, 500),
      })
      .where('"jobId" = :jobId AND success IS NULL', { jobId: String(job.id) })
      .execute();

    const isFinalAttempt =
      (job.attemptsMade ?? 0) >= (job.opts?.attempts ?? 1);

    if (isFinalAttempt) {
      await this.notifRepo.update(notificationRecordId, {
        status: NotificationStatus.FAILED,
      });
      this.logger.warn(
        `Job ${job.id} exhausted all attempts. NotificationRecord ${notificationRecordId} marked FAILED.`,
      );
    }
  }

  private extractRecordId(job: Job | undefined): string | undefined {
    return (
      (job?.data as Record<string, unknown> | undefined)
        ?.notificationRecordId as string | undefined
    );
  }
}
