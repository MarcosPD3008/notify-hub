export abstract class BaseNotificationProvider {
  abstract readonly providerName: string;

  abstract send(payload: any): Promise<void>;

  abstract getHealth(): {
    status: 'CONNECTED' | 'WAITING_QR';
    latency: string;
  };
}
