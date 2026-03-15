import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { BaseNotificationProvider } from './base-notification.provider';
import { parseWhatsappSendDto } from '../dto/whatsapp-send.dto';
import { ProviderStateService } from '../services/provider-state.service';

interface BaileysSocket {
  ev: {
    on(
      event: 'connection.update',
      listener: (update: Record<string, unknown>) => void,
    ): void;
    on(event: 'creds.update', listener: () => void): void;
  };
  sendMessage(jid: string, content: { text: string }): Promise<unknown>;
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
  private socket: BaileysSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isBootstrapping = false;

  constructor(private readonly providerState: ProviderStateService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.bootstrapBaileys();
  }

  async send(payload: unknown): Promise<void> {
    const dto = parseWhatsappSendDto(payload);

    if (!this.socket) {
      throw new Error(
        'WhatsApp socket is not initialized. Install @whiskeysockets/baileys and pair device first.',
      );
    }

    const startedAt = performance.now();
    for (const to of dto.to) {
      const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
      await this.socket.sendMessage(jid, { text: dto.message });
    }

    this.providerState.setLatency(
      this.providerName,
      Math.round(performance.now() - startedAt),
    );
  }

  getHealth(): { status: 'CONNECTED' | 'WAITING_QR'; latency: string } {
    const snapshot = this.providerState.getSnapshot(this.providerName);
    return {
      status: snapshot.status,
      latency: snapshot.latencyMs === null ? 'n/a' : `${snapshot.latencyMs}ms`,
    };
  }

  private async bootstrapBaileys(): Promise<void> {
    if (this.isBootstrapping) {
      return;
    }

    this.isBootstrapping = true;
    const baileys = this.loadBaileys();

    if (!baileys) {
      this.logger.warn(
        'Dependency @whiskeysockets/baileys not available. /health will stay in WAITING_QR until dependency is installed.',
      );
      this.isBootstrapping = false;
      return;
    }

    try {
      const authDir = this.resolveAuthDir();
      await mkdir(authDir, { recursive: true });

      const { state, saveCreds } = await baileys.useMultiFileAuthState(authDir);
      const socket = baileys.default({ auth: state, printQRInTerminal: false });

      socket.ev.on('connection.update', (update) => {
        const qr = typeof update.qr === 'string' ? update.qr : null;
        const connection =
          typeof update.connection === 'string' ? update.connection : '';
        const statusCode = this.getDisconnectStatusCode(update);

        if (qr) {
          this.providerState.setQr(this.providerName, qr);
          this.providerState.setConnectionStatus(this.providerName, 'WAITING_QR');
        }

        if (connection === 'open') {
          this.clearReconnectTimer();
          this.providerState.setQr(this.providerName, null);
          this.providerState.setConnectionStatus(this.providerName, 'CONNECTED');
          this.logger.log('WhatsApp connected successfully.');
        }

        if (connection === 'close') {
          this.providerState.setConnectionStatus(this.providerName, 'WAITING_QR');
          this.socket = null;

          if (statusCode === 401) {
            this.logger.warn(
              'WhatsApp session logged out (401). Delete auth files and pair again.',
            );
            return;
          }

          this.logger.warn(
            `WhatsApp connection closed${statusCode ? ` (code: ${statusCode})` : ''}. Retrying in 5s.`,
          );
          this.scheduleReconnect();
        }
      });

      socket.ev.on('creds.update', () => {
        void saveCreds();
      });

      this.socket = socket;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to bootstrap WhatsApp adapter: ${message}`);
      this.scheduleReconnect();
    } finally {
      this.isBootstrapping = false;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.bootstrapBaileys();
    }, 5000);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private getDisconnectStatusCode(update: Record<string, unknown>): number | null {
    const lastDisconnect = update.lastDisconnect;
    if (!lastDisconnect || typeof lastDisconnect !== 'object') {
      return null;
    }

    const error = (lastDisconnect as { error?: unknown }).error;
    if (!error || typeof error !== 'object') {
      return null;
    }

    const output = (error as { output?: unknown }).output;
    if (!output || typeof output !== 'object') {
      return null;
    }

    const statusCode = (output as { statusCode?: unknown }).statusCode;
    return typeof statusCode === 'number' ? statusCode : null;
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
