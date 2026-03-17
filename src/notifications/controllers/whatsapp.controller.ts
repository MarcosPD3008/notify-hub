import {
  Controller,
  Get,
  Header,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ProviderStateService } from '../services/provider-state.service';

@ApiTags('WhatsApp')
@Controller()
export class WhatsappController {
  constructor(private readonly providerState: ProviderStateService) {}

  @Get('auth/qr')
  @ApiOperation({
    summary: 'Obtiene el último QR de autenticación de WhatsApp',
  })
  @ApiProduces('text/html')
  @ApiResponse({ status: 200, description: 'HTML con QR en texto' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQr(@Query('format') format?: string): string {
    const qr = this.providerState.getQr('whatsapp');

    if (format === 'raw') {
      return qr ?? '';
    }

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>MICRO.Notify QR</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  </head>
  <body style="font-family: sans-serif; padding: 1rem;">
    <h1>WhatsApp Auth QR</h1>
    <p>Status: ${qr ? 'WAITING_QR' : 'CONNECTED / NO_QR'}</p>
    
    ${
      qr
        ? `
      <div id="qr-container"></div>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const qrData = ${JSON.stringify(qr)};
          if (qrData) {
            new QRCode(document.getElementById("qr-container"), {
              text: qrData,
              width: 300,
              height: 300,
            });
          }
        });
      </script>
      <div style="margin-top: 1rem;">
        <p style="font-size: 0.9em; color: #555;">Raw Code:</p>
        <pre style="white-space: pre-wrap; word-break: break-word; font-size: 0.8em; color: gray;">${qr}</pre>
      </div>
    `
        : '<p>No QR available. Device might already be connected.</p>'
    }
  </body>
</html>`;
  }

  @Sse(process.env.QR_STREAM_PATH?.replace(/^\//, '') || 'events/whatsapp/qr')
  @ApiOperation({ summary: 'SSE stream del último QR de WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Evento SSE con el QR actual y actualizaciones',
  })
  qrEvents(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const emitQr = (qr: string | null) => {
        subscriber.next({
          type: 'qr',
          data: { provider: 'whatsapp', qr },
        });
      };

      // Emitimos el QR actual al conectar
      emitQr(this.providerState.getQr('whatsapp'));

      // Nos suscribimos a futuras actualizaciones
      const unsubscribe = this.providerState.onQrUpdate('whatsapp', (qr) => {
        emitQr(qr);
      });

      // Heartbeat para mantener la conexión activa (cada 15s)
      const heartbeat = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: 'keep-alive',
        });
      }, 15000);

      // Limpieza al desconectar
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    });
  }
}
