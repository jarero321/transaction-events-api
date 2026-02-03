import { TransactionEvent } from '../../domain/entities';

export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');

export interface EventPublisherPort {
  publish(event: TransactionEvent): Promise<void>;
}
