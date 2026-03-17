import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProviderFactoryService } from '../services/provider-factory.service';

@Processor('notifications-queue')
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly providerFactory: ProviderFactoryService) {
    super();
  }

  async process(
    job: Job<{ provider: string; payload: unknown }, unknown, string>,
  ): Promise<void> {
    if (job.name === 'send-message') {
      const provider = this.providerFactory.get(job.data.provider);
      if (provider) {
        await provider.send(job.data.payload);
      }
    }
  }
}
