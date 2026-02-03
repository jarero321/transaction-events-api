import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';
import { MetricsPort } from '../../../application/ports/metrics.port';

@Injectable()
export class MetricsService implements MetricsPort, OnModuleInit {
  private readonly registry: Registry;
  private readonly transactionsCreated: Counter;
  private readonly transactionsCompleted: Counter;
  private readonly transactionsFailed: Counter;
  private readonly transactionAmount: Histogram;
  private readonly processingDuration: Histogram;

  constructor() {
    this.registry = new Registry();

    this.transactionsCreated = new Counter({
      name: 'transactions_created_total',
      help: 'Total number of transactions created',
      labelNames: ['currency'],
      registers: [this.registry],
    });

    this.transactionsCompleted = new Counter({
      name: 'transactions_completed_total',
      help: 'Total number of transactions completed',
      labelNames: ['currency'],
      registers: [this.registry],
    });

    this.transactionsFailed = new Counter({
      name: 'transactions_failed_total',
      help: 'Total number of transactions failed',
      labelNames: ['currency', 'reason'],
      registers: [this.registry],
    });

    this.transactionAmount = new Histogram({
      name: 'transaction_amount',
      help: 'Transaction amount distribution',
      labelNames: ['currency'],
      buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000],
      registers: [this.registry],
    });

    this.processingDuration = new Histogram({
      name: 'transaction_processing_duration_ms',
      help: 'Transaction processing duration in milliseconds',
      labelNames: ['status'],
      buckets: [50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  incrementTransactionCreated(currency: string): void {
    this.transactionsCreated.labels(currency).inc();
  }

  incrementTransactionCompleted(currency: string): void {
    this.transactionsCompleted.labels(currency).inc();
  }

  incrementTransactionFailed(currency: string, reason: string): void {
    this.transactionsFailed.labels(currency, reason).inc();
  }

  recordTransactionAmount(amount: number, currency: string): void {
    this.transactionAmount.labels(currency).observe(amount);
  }

  recordProcessingDuration(durationMs: number, status: string): void {
    this.processingDuration.labels(status).observe(durationMs);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
