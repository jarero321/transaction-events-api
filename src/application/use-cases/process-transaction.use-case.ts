import { Inject, Injectable } from '@nestjs/common';
import { TransactionEvent } from '../../domain/entities';
import { TransactionEventType } from '../../domain/enums';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
  METRICS_PORT,
  MetricsPort,
  LOGGER_PORT,
  LoggerPort,
} from '../ports';

export interface ProcessTransactionInput {
  transactionId: string;
}

@Injectable()
export class ProcessTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repository: TransactionRepository,
    @Inject(METRICS_PORT)
    private readonly metrics: MetricsPort,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: ProcessTransactionInput): Promise<void> {
    const startTime = Date.now();

    const transaction = await this.repository.findById(input.transactionId);
    if (!transaction) {
      this.logger.error('Transaction not found', undefined, {
        transactionId: input.transactionId,
      });
      return;
    }

    this.logger.info('Processing transaction', {
      transactionId: transaction.id,
    });

    transaction.markAsProcessing();

    try {
      await this.processPayment();
      await this.completeTransaction(transaction, startTime);
    } catch (error) {
      await this.failTransaction(transaction, error, startTime);
    }
  }

  private async completeTransaction(transaction: any, startTime: number): Promise<void> {
    transaction.markAsCompleted();

    const event = new TransactionEvent({
      type: TransactionEventType.TRANSACTION_COMPLETED,
      transactionId: transaction.id,
      payload: transaction.toJSON(),
    });

    await this.repository.updateWithEvent({ transaction, event });

    const duration = Date.now() - startTime;
    this.metrics.incrementTransactionCompleted(transaction.currency);
    this.metrics.recordProcessingDuration(duration, 'completed');

    this.logger.info('Transaction completed', {
      transactionId: transaction.id,
      durationMs: duration,
    });
  }

  private async failTransaction(transaction: any, error: unknown, startTime: number): Promise<void> {
    transaction.markAsFailed();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const event = new TransactionEvent({
      type: TransactionEventType.TRANSACTION_FAILED,
      transactionId: transaction.id,
      payload: { ...transaction.toJSON(), error: errorMessage },
    });

    await this.repository.updateWithEvent({ transaction, event });

    const duration = Date.now() - startTime;
    this.metrics.incrementTransactionFailed(transaction.currency, errorMessage);
    this.metrics.recordProcessingDuration(duration, 'failed');

    this.logger.error('Transaction failed', error instanceof Error ? error : undefined, {
      transactionId: transaction.id,
    });
  }

  private async processPayment(): Promise<void> {
    const processingTime = Math.random() * 500 + 100;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    if (Math.random() < 0.1) {
      throw new Error('Payment processing failed');
    }
  }
}
