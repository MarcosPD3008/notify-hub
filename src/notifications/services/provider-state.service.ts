import { Injectable } from '@nestjs/common';

export type ProviderConnectionStatus = 'CONNECTED' | 'WAITING_QR';

interface ProviderRuntimeState {
  qr: string | null;
  status: ProviderConnectionStatus;
  latencyMs: number | null;
}

@Injectable()
export class ProviderStateService {
  private readonly providerState = new Map<string, ProviderRuntimeState>();

  setQr(providerName: string, qr: string | null): void {
    this.ensure(providerName).qr = qr;
  }

  getQr(providerName: string): string | null {
    return this.ensure(providerName).qr;
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
