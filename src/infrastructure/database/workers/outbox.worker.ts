import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  OUTBOX_REPOSITORY,
  OutboxRepository,
} from '../../../application/ports/outbox.port';
import { LOGGER_PORT, LoggerPort } from '../../../application/ports/logger.port';
import { KafkaProducerService } from '../../kafka/kafka-producer.service';

const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 100;

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private isRunning = false;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
  ) {}

  onModuleInit() {
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.info('Outbox worker started');
    this.poll();
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    this.logger.info('Outbox worker stopped');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.processEvents();
    } catch (error) {
      this.logger.error('Outbox worker error', { error });
    }

    this.pollTimeout = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
  }

  private async processEvents(): Promise<void> {
    const events = await this.outboxRepository.findPendingEvents(BATCH_SIZE);

    if (events.length === 0) return;

    const eventIds = events.map((e) => e.eventId);
    await this.outboxRepository.markAsProcessing(eventIds);

    this.logger.info('Processing outbox events', { count: events.length });

    for (const event of events) {
      try {
        await this.kafkaProducer.publishRaw(
          event.eventId,
          event.eventType,
          event.aggregateId,
          event.payload,
        );

        await this.outboxRepository.markAsCompleted(event.eventId);

        this.logger.info('Outbox event published', {
          eventId: event.eventId,
          eventType: event.eventType,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        await this.outboxRepository.markAsFailed(event.eventId, errorMessage);

        this.logger.error('Failed to publish outbox event', {
          eventId: event.eventId,
          error: errorMessage,
        });
      }
    }
  }
}
