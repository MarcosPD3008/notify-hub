import { Controller, Get, Header, Query } from '@nestjs/common';
import { ProviderStateService } from '../services/provider-state.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly providerState: ProviderStateService) {}

  @Get('qr')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQr(@Query('format') format?: string): string {
    const snapshot = this.providerState.getSnapshot('whatsapp');
    const qr = snapshot.qr;

    if (format === 'raw') {
      return qr ?? '';
    }

    return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>MICRO.Notify QR</title></head>
  <body style="font-family: sans-serif; padding: 1rem;">
    <h1>WhatsApp Auth QR</h1>
    <p>Status: ${snapshot.status}</p>
    <pre style="white-space: pre-wrap; word-break: break-word;">${qr ?? 'No QR available yet. Keep this page open and refresh in a few seconds.'}</pre>
  </body>
</html>`;
  }
}
