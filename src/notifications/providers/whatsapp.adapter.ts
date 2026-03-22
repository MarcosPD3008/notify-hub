import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { BaseNotificationProvider } from './base-notification.provider';
import {
  parseWhatsappSendDto,
  WhatsappDocumentDto,
} from '../dto/whatsapp-send.dto';
import { ProviderStateService } from '../services/provider-state.service';
import { Cron } from '@nestjs/schedule';
import { MonitoringService } from '../services/monitoring.service';

interface ConnectionUpdate {
  qr?: string;
  connection?: string;
  lastDisconnect?: {
    error?: {
      output?: {
        statusCode?: number;
      };
    };
  };
}

type BaileysContent =
  | { text: string }
  | { image: Buffer; caption?: string; mimetype?: string }
  | { video: Buffer; caption?: string; mimetype?: string }
  | { audio: Buffer; mimetype?: string }
  | { document: Buffer; mimetype: string; fileName?: string; caption?: string };

interface BaileysSocket {
  ev: {
    on(
      event: 'connection.update',
      listener: (update: ConnectionUpdate) => void,
    ): void;
    on(event: 'creds.update', listener: () => void): void;
  };
  sendMessage(jid: string, content: BaileysContent): Promise<unknown>;
}

interface BaileysModule {
  default: (config: Record<string, unknown>) => BaileysSocket;
  useMultiFileAuthState: (
    authDir: string,
  ) => Promise<{ state: unknown; saveCreds: () => Promise<void> }>;
}

@Injectable()
export class WhatsappAdapter
  extends BaseNotificationProvider
  implements OnModuleInit
{
  readonly providerName = 'whatsapp';

  private readonly logger = new Logger(WhatsappAdapter.name);
  private readonly reconnectBaseDelayMs = Number(
    process.env.WHATSAPP_RECONNECT_BASE_DELAY_MS ?? 5000,
  );
  private readonly reconnectMaxDelayMs = Number(
    process.env.WHATSAPP_RECONNECT_MAX_DELAY_MS ?? 60000,
  );

  private socket: BaileysSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly providerState: ProviderStateService,
    private readonly monitoringService: MonitoringService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.bootstrapBaileys();
  }

  @Cron('*/5 * * * *') // Run every 5 minutes
  async monitorWhatsAppStatus(): Promise<void> {
    await this.monitoringService.checkWhatsAppStatus();
  }

  async send(payload: unknown): Promise<void> {
    const dto = parseWhatsappSendDto(payload);

    if (!this.socket) {
      throw new Error(
        'WhatsApp socket is not initialized. Install @whiskeysockets/baileys and pair device first.',
      );
    }

    const rateDelay = parseInt(
      process.env.WHATSAPP_RATE_LIMIT_DURATION || '1000',
      10,
    );
    const startedAt = performance.now();

    for (const to of dto.to) {
      const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;

      if (dto.message) {
        await this.socket.sendMessage(jid, { text: dto.message });
        await new Promise((resolve) => setTimeout(resolve, rateDelay));
      }

      for (const doc of dto.documents ?? []) {
        await this.socket.sendMessage(jid, await this.buildBaileysContent(doc));
        await new Promise((resolve) => setTimeout(resolve, rateDelay));
      }
    }

    this.providerState.setLatency(
      this.providerName,
      Math.round(performance.now() - startedAt),
    );
  }

  private async buildBaileysContent(
    doc: WhatsappDocumentDto,
  ): Promise<BaileysContent> {
    const { buffer, mimetype } = await this.resolveMedia(doc);

    if (mimetype.startsWith('image/')) {
      return { image: buffer, mimetype, caption: doc.caption };
    }

    if (mimetype.startsWith('video/')) {
      return { video: buffer, mimetype, caption: doc.caption };
    }

    if (mimetype.startsWith('audio/')) {
      return { audio: buffer, mimetype };
    }

    return {
      document: buffer,
      mimetype,
      fileName: doc.filename,
      caption: doc.caption,
    };
  }

  private async resolveMedia(
    doc: WhatsappDocumentDto,
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    if (doc.base64) {
      this.logger.log(`Decoding base64 media (${doc.mimetype})`);
      return {
        buffer: Buffer.from(doc.base64, 'base64'),
        mimetype: doc.mimetype ?? '',
      };
    }

    this.logger.log(`Fetching media from URL: ${doc.url}`);
    let response: Response;
    try {
      response = await fetch(doc.url as string, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
    } catch (err) {
      this.logger.error(`Network error fetching media: ${String(err)}`);
      throw err;
    }

    const rawContentType =
      response.headers.get('content-type') ?? 'application/octet-stream';
    const detectedMimetype = rawContentType.split(';')[0].trim();

    this.logger.log(
      `Fetch response: ${response.status} ${response.statusText} — content-type: ${detectedMimetype}`,
    );

    if (!response.ok) {
      const msg = `Failed to fetch media from URL (${response.status}): ${doc.url}`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimetype = doc.mimetype ?? detectedMimetype;
    this.logger.log(
      `Media downloaded: ${buffer.byteLength} bytes — mimetype: ${mimetype}`,
    );
    return { buffer, mimetype };
  }

  getHealth(): { status: 'CONNECTED' | 'WAITING_QR'; latency: string } {
    const snapshot = this.providerState.getSnapshot(this.providerName);
    return {
      status: snapshot.status,
      latency: snapshot.latencyMs === null ? 'n/a' : `${snapshot.latencyMs}ms`,
    };
  }

  private async bootstrapBaileys(): Promise<void> {
    const baileys = this.loadBaileys();

    if (!baileys) {
      this.logger.warn(
        'Dependency @whiskeysockets/baileys not available. /health will stay in WAITING_QR until dependency is installed.',
      );
      return;
    }

    const authDir = this.resolveAuthDir();
    await mkdir(authDir, { recursive: true });

    const { state, saveCreds } = await baileys.useMultiFileAuthState(authDir);
    const socket = baileys.default({
      auth: state,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      version: [2, 3000, 1033893291],
    });

    socket.ev.on('connection.update', (update) => {
      const qr = typeof update.qr === 'string' ? update.qr : null;
      const connection =
        typeof update.connection === 'string' ? update.connection : '';

      if (qr) {
        this.providerState.setQr(this.providerName, qr);
        this.providerState.setConnectionStatus(this.providerName, 'WAITING_QR');
      }

      if (connection === 'open') {
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
        this.providerState.setQr(this.providerName, null);
        this.providerState.setConnectionStatus(this.providerName, 'CONNECTED');
      }

      if (connection === 'close') {
        this.socket = null;
        this.providerState.setConnectionStatus(this.providerName, 'WAITING_QR');
        this.scheduleReconnect(update);
      }
    });

    socket.ev.on('creds.update', () => {
      void saveCreds();
    });

    this.socket = socket;
  }

  private scheduleReconnect(update: ConnectionUpdate): void {
    if (this.reconnectTimer) {
      return;
    }

    const code = update.lastDisconnect?.error?.output?.statusCode;
    const delay = this.getReconnectDelayMs();

    this.logger.warn(
      `WhatsApp connection closed${code ? ` (code: ${code})` : ''}. Retrying in ${delay}ms.`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.bootstrapBaileys();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private getReconnectDelayMs(): number {
    const exponentialDelay =
      this.reconnectBaseDelayMs * 2 ** this.reconnectAttempts;
    this.reconnectAttempts += 1;

    return Math.min(exponentialDelay, this.reconnectMaxDelayMs);
  }

  private resolveAuthDir(): string {
    return process.env.WHATSAPP_AUTH_DIR ?? '/app/data/baileys-auth';
  }

  private loadBaileys(): BaileysModule | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@whiskeysockets/baileys') as BaileysModule;
    } catch {
      return null;
    }
  }
}
