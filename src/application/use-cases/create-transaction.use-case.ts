import { Inject, Injectable } from '@nestjs/common';
import { Transaction, TransactionEvent } from '../../domain/entities';
import { TransactionEventType } from '../../domain/enums';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
  IDEMPOTENCY_SERVICE,
  IdempotencyService,
  METRICS_PORT,
  MetricsPort,
  LOGGER_PORT,
  LoggerPort,
} from '../ports';

export interface CreateTransactionInput {
  amount: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  idempotencyKey?: string;
}

export interface CreateTransactionOutput {
  transaction: Transaction;
  cached: boolean;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repository: TransactionRepository,
    @Inject(IDEMPOTENCY_SERVICE)
    private readonly idempotency: IdempotencyService,
    @Inject(METRICS_PORT)
    private readonly metrics: MetricsPort,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: CreateTransactionInput): Promise<CreateTransactionOutput> {
    const cached = await this.tryGetCached(input.idempotencyKey);
    if (cached) return { transaction: cached, cached: true };

    const transaction = new Transaction(input);
    const event = new TransactionEvent({
      type: TransactionEventType.CREATE_TRANSACTION,
      transactionId: transaction.id,
      payload: transaction.toJSON(),
    });

    await this.repository.saveWithEvent({
      transaction,
      event,
      idempotencyKey: input.idempotencyKey,
    });

    this.metrics.incrementTransactionCreated(transaction.currency);
    this.metrics.recordTransactionAmount(transaction.amount, transaction.currency);
    this.logger.info('Transaction created', { transactionId: transaction.id });

    return { transaction, cached: false };
  }

  private async tryGetCached(key?: string): Promise<Transaction | null> {
    if (!key) return null;

    const record = await this.idempotency.exists(key);
    if (!record) return null;

    this.logger.info('Returning cached transaction', { idempotencyKey: key });
    return Transaction.fromJSON(record.response);
  }
}
