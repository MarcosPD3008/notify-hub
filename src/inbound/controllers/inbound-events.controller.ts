import { Controller, Get, HttpCode, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { InboundSseService } from '../services/inbound-sse.service';

@ApiTags('Inbound')
@Controller('events/inbound')
export class InboundEventsController {
  constructor(private readonly sseService: InboundSseService) {}

  @Sse()
  @ApiOperation({ summary: 'SSE stream of inbound messages across all channels' })
  stream(): Observable<MessageEvent> {
    return this.sseService.stream().pipe(
      map((record) => ({ data: record, type: 'inbound.message' }) as MessageEvent),
    );
  }

  /** Emite un evento de prueba — útil para verificar que el pipeline SSE funciona */
  @Get('test')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Emit a fake inbound event to test the SSE pipeline' })
  test(): { ok: boolean } {
    this.sseService.emitTest();
    return { ok: true };
  }
}
