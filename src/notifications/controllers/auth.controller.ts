import { Controller, Get, Header, Query } from '@nestjs/common';
import { ProviderStateService } from '../services/provider-state.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly providerState: ProviderStateService) {}

  @Get('qr')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQr(@Query('format') format?: string): string {
    const qr = this.providerState.getQr('whatsapp');

    if (format === 'raw') {
      return qr ?? '';
    }

    return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>MICRO.Notify QR</title></head>
  <body style="font-family: sans-serif; padding: 1rem;">
    <h1>WhatsApp Auth QR</h1>
    <p>Status: ${qr ? 'WAITING_QR' : 'CONNECTED / NO_QR'}</p>
    <pre style="white-space: pre-wrap; word-break: break-word;">${qr ?? 'No QR available. Device might already be connected.'}</pre>
  </body>
</html>`;
  }
}
