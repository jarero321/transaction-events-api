import { v4 as uuidv4 } from 'uuid';
import { TransactionEventType } from '../enums';

export interface TransactionEventProps {
  eventId?: string;
  type: TransactionEventType;
  transactionId: string;
  payload: Record<string, unknown>;
  timestamp?: Date;
}

export class TransactionEvent {
  readonly eventId: string;
  readonly type: TransactionEventType;
  readonly transactionId: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: Date;

  constructor(props: TransactionEventProps) {
    this.eventId = props.eventId ?? uuidv4();
    this.type = props.type;
    this.transactionId = props.transactionId;
    this.payload = props.payload;
    this.timestamp = props.timestamp ?? new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      type: this.type,
      transactionId: this.transactionId,
      payload: this.payload,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
