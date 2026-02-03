import { Transaction, TransactionEvent } from '../../domain/entities';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface SaveWithEventOptions {
  transaction: Transaction;
  event: TransactionEvent;
  idempotencyKey?: string;
}

export interface UpdateWithEventOptions {
  transaction: Transaction;
  event: TransactionEvent;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findAll(): Promise<Transaction[]>;
  findAllPaginated(limit: number, offset: number): Promise<[Transaction[], number]>;
  update(transaction: Transaction): Promise<Transaction>;
  saveEvent(event: TransactionEvent): Promise<TransactionEvent>;
  findEventsByTransactionId(transactionId: string): Promise<TransactionEvent[]>;
  saveWithEvent(options: SaveWithEventOptions): Promise<void>;
  updateWithEvent(options: UpdateWithEventOptions): Promise<void>;
}
