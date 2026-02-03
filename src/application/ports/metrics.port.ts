export const METRICS_PORT = Symbol('METRICS_PORT');

export interface MetricsPort {
  incrementTransactionCreated(currency: string): void;
  incrementTransactionCompleted(currency: string): void;
  incrementTransactionFailed(currency: string, reason: string): void;
  recordTransactionAmount(amount: number, currency: string): void;
  recordProcessingDuration(durationMs: number, status: string): void;
  getMetrics(): Promise<string>;
}
