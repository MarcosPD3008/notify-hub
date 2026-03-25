export type ChannelStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'DEGRADED'
  | 'PENDING_AUTH';

export interface InboundMessage {
  /** Internal ID assigned by the hub */
  id: string;
  /** Provider name, e.g. 'whatsapp' */
  channel: string;
  /** Sender identifier (phone number, email, etc.) */
  from: string;
  /** Recipient identifier on our side */
  to: string;
  /** Plain-text body when available */
  text: string | null;
  /** Raw provider message — shape is provider-specific */
  raw: unknown;
  receivedAt: Date;
}

export type InboundMessageHandler = (msg: InboundMessage) => Promise<void>;

export abstract class BaseNotificationProvider {
  abstract readonly providerName: string;

  /** Whether this channel can receive inbound messages */
  readonly supportsInbound: boolean = false;

  abstract send(payload: unknown): Promise<void>;

  abstract getChannelStatus(): ChannelStatus;

  /**
   * Register a handler that will be called for every inbound message.
   * Only called when supportsInbound === true.
   */
  onInboundMessage?(handler: InboundMessageHandler): void;
}
