export const OUTBOX_REPOSITORY = Symbol('OUTBOX_REPOSITORY');

export interface OutboxEvent {
  eventId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface OutboxRepository {
  save(event: OutboxEvent): Promise<void>;
  findPendingEvents(limit: number): Promise<OutboxEvent[]>;
  markAsCompleted(eventId: string): Promise<void>;
  markAsFailed(eventId: string, error: string): Promise<void>;
  markAsProcessing(eventIds: string[]): Promise<void>;
}
