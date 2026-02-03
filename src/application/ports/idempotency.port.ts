export const IDEMPOTENCY_SERVICE = Symbol('IDEMPOTENCY_SERVICE');

export interface IdempotencyRecord {
  idempotencyKey: string;
  transactionId: string;
  response: Record<string, unknown>;
}

export interface IdempotencyService {
  exists(key: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
  cleanup(): Promise<number>;
}
