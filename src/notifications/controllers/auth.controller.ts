import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProviderStateService } from '../services/provider-state.service';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

@Controller('auth')
export class AuthController {
  constructor(private readonly providerState: ProviderStateService) {}

  @Get('qr')
  getQr(
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): string {
    const qr = this.providerState.getQr('whatsapp');

    if (format === 'raw') {
      res?.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return qr ?? '';
    }

    res?.setHeader('Content-Type', 'text/html; charset=utf-8');
    const escapedQr = qr ? escapeHtml(qr) : null;
    return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>MICRO.Notify QR</title></head>
  <body style="font-family: sans-serif; padding: 1rem;">
    <h1>WhatsApp Auth QR</h1>
    <p>Status: ${escapedQr ? 'WAITING_QR' : 'CONNECTED / NO_QR'}</p>
    <pre style="white-space: pre-wrap; word-break: break-word;">${escapedQr ?? 'No QR available. Device might already be connected.'}</pre>
  </body>
</html>`;
  }
}
