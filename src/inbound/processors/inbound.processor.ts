import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InboundRecord } from '../entities/inbound-record.entity';
import { InboundMessage } from '../../notifications/providers/base-notification.provider';
import { INBOUND_QUEUE } from '../services/inbound-message.service';

@Processor(INBOUND_QUEUE)
export class InboundProcessor extends WorkerHost {
  private readonly logger = new Logger(InboundProcessor.name);

  constructor(
    @InjectRepository(InboundRecord)
    private readonly recordRepo: Repository<InboundRecord>,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<InboundMessage>): Promise<void> {
    const msg = job.data;

    const record = this.recordRepo.create({
      id: msg.id,
      channel: msg.channel,
      from: msg.from,
      to: msg.to,
      text: msg.text,
      raw: msg.raw,
      receivedAt: new Date(msg.receivedAt),
      serviceId: null,
    });

    await this.recordRepo.save(record);

    this.logger.log(`Persisted inbound record ${record.id} from ${record.from}`);

    // Emit for SSE subscribers and webhook dispatcher
    const listenerCount = this.events.listenerCount('inbound.message');
    this.logger.log(`Emitting inbound.message to ${listenerCount} listener(s)`);
    this.events.emit('inbound.message', record);
  }
}
