import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProviderFactoryService } from '../services/provider-factory.service';
import { JobLifecycleService } from '../services/job-lifecycle.service';

@Processor('notifications-queue')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private readonly providerFactory: ProviderFactoryService,
    private readonly lifecycle: JobLifecycleService,
  ) {
    super();
  }

  async process(
    job: Job<{ provider: string; payload: unknown; notificationRecordId?: string }>,
  ): Promise<void> {
    if (job.name === 'send-message') {
      const provider = this.providerFactory.get(job.data.provider);
      if (provider) {
        await provider.send(job.data.payload);
      }
    }
  }

  @OnWorkerEvent('active')
  async onActive(job: Job): Promise<void> {
    await this.lifecycle.onActive(job);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job): Promise<void> {
    await this.lifecycle.onCompleted(job);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    await this.lifecycle.onFailed(job, error);
  }
}
