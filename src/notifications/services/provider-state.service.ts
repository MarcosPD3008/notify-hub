import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export type ProviderConnectionStatus = 'CONNECTED' | 'WAITING_QR';

interface ProviderRuntimeState {
  qr: string | null;
  status: ProviderConnectionStatus;
  latencyMs: number | null;
  verifiedMessages: Set<string>;
}

@Injectable()
export class ProviderStateService {
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

  markMessageAsVerified(providerName: string, messageId: string): void {
    const state = this.ensure(providerName);
    state.verifiedMessages.add(messageId);
  }

  isMessageVerified(providerName: string, messageId: string): boolean {
    const state = this.ensure(providerName);
    return state.verifiedMessages.has(messageId);
  }

  getSnapshot(providerName: string): ProviderRuntimeState {
    return this.ensure(providerName);
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
        verifiedMessages: new Set(),
      });
    }

    return this.providerState.get(providerName)!;
  }
}
