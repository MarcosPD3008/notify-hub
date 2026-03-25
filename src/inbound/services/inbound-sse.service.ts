import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import { InboundRecord } from '../entities/inbound-record.entity';

@Injectable()
export class InboundSseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InboundSseService.name);
  private readonly subject = new Subject<InboundRecord>();
  private listenerCount = 0;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit(): void {
    this.eventEmitter.on('inbound.message', (record: InboundRecord) => {
      this.logger.log(`SSE pushing record ${record.id} to ${this.listenerCount} subscriber(s)`);
      this.subject.next(record);
    });
    this.logger.log('Listening for inbound.message events');
  }

  onModuleDestroy(): void {
    this.subject.complete();
  }

  stream(): Observable<InboundRecord> {
    this.listenerCount++;
    this.logger.log(`New SSE subscriber — total: ${this.listenerCount}`);
    return new Observable((subscriber) => {
      const sub = this.subject.subscribe(subscriber);
      return () => {
        this.listenerCount--;
        this.logger.log(`SSE subscriber left — total: ${this.listenerCount}`);
        sub.unsubscribe();
      };
    });
  }

  /** Emite un registro de prueba para verificar el pipeline SSE sin Baileys */
  emitTest(): void {
    const fake = {
      id: 'test-' + Date.now(),
      channel: 'test',
      from: 'test-sender',
      to: 'self',
      text: 'Mensaje de prueba desde /events/inbound/test',
      raw: {},
      receivedAt: new Date(),
      serviceId: null,
    } as InboundRecord;
    this.logger.log('Emitting test SSE event');
    this.subject.next(fake);
  }
}
