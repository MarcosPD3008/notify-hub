import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import { join } from 'path';

export type ProviderConnectionStatus = 'CONNECTED' | 'WAITING_QR';

interface ProviderRuntimeState {
  qr: string | null;
  status: ProviderConnectionStatus;
  latencyMs: number | null;
}

@Injectable()
export class ProviderStateService {
  private readonly logger = new Logger(ProviderStateService.name);
  private readonly authInfoPath = join(process.cwd(), 'auth_info');

  private readonly providerState = new Map<string, ProviderRuntimeState>();
  private readonly qrEventEmitter = new EventEmitter();

  constructor() {
    this.qrEventEmitter.setMaxListeners(0);
  }

  setQr(providerName: string, qr: string | null): void {
    this.ensure(providerName).qr = qr;
    this.qrEventEmitter.emit(this.toQrEvent(providerName), qr);
  }

  getQr(providerName: string): string | null {
    return this.ensure(providerName).qr;
  }

  onQrUpdate(
    providerName: string,
    listener: (qr: string | null) => void,
  ): () => void {
    const eventName = this.toQrEvent(providerName);
    this.qrEventEmitter.on(eventName, listener);

    return () => {
      this.qrEventEmitter.off(eventName, listener);
    };
  }

  setConnectionStatus(
    providerName: string,
    status: ProviderConnectionStatus,
  ): void {
    this.ensure(providerName).status = status;
  }

  setLatency(providerName: string, latencyMs: number | null): void {
    this.ensure(providerName).latencyMs = latencyMs;
  }

  getSnapshot(providerName: string): ProviderRuntimeState {
    return this.ensure(providerName);
  }

  handleConnectionError(error: any) {
    if (error?.code === 401 || error?.code === 500) {
      this.logger.error(`Session error detected: ${error.message}`);
      this.resetSession();
    }
  }

  private resetSession() {
    this.logger.warn('Resetting session due to error...');
    try {
      if (fs.existsSync(this.authInfoPath)) {
        fs.removeSync(this.authInfoPath);
        this.logger.log('Auth info directory removed successfully.');
      }
    } catch (err) {
      this.logger.error(`Failed to remove auth info directory: ${err.message}`);
    }

    this.restartProcess();
  }

  private restartProcess() {
    this.logger.log('Restarting process to generate a new QR code...');
    process.exit(1); // Exit the process to allow a restart mechanism to take over
  }

  private toQrEvent(providerName: string): string {
    return `provider:${providerName}:qr`;
  }

  private ensure(providerName: string): ProviderRuntimeState {
    if (!this.providerState.has(providerName)) {
      this.providerState.set(providerName, {
        qr: null,
        status: 'WAITING_QR',
        latencyMs: null,
      });
    }

    return this.providerState.get(providerName)!;
  }
}
