import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProviderFactoryService } from '../services/provider-factory.service';

@Processor('whatsapp-queue', {
  limiter: {
    max: parseInt(process.env.WHATSAPP_RATE_LIMIT_MAX || '1', 10),
    duration: parseInt(process.env.WHATSAPP_RATE_LIMIT_DURATION || '1000', 10),
  },
})
export class WhatsappProcessor extends WorkerHost {
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
