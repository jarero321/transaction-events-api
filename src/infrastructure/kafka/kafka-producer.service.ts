import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Producer, Partitioners } from 'kafkajs';
import { TransactionEvent } from '../../domain/entities';
import { EventPublisherPort } from '../../application/ports/event-publisher.port';
import { LOGGER_PORT, LoggerPort } from '../../application/ports/logger.port';

const TRANSACTION_EVENTS_TOPIC = 'transaction-events';

@Injectable()
export class KafkaProducerService implements EventPublisherPort, OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
  ) {
    this.kafka = new Kafka({
      clientId: 'transaction-api',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.info('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    this.logger.info('Kafka producer disconnected');
  }

  async publish(event: TransactionEvent): Promise<void> {
    const message = {
      key: event.transactionId,
      value: JSON.stringify(event.toJSON()),
      headers: {
        eventType: event.type,
        eventId: event.eventId,
        timestamp: event.timestamp.toISOString(),
      },
    };

    await this.producer.send({
      topic: TRANSACTION_EVENTS_TOPIC,
      messages: [message],
    });

    this.logger.info('Event published to Kafka', {
      eventId: event.eventId,
      eventType: event.type,
      transactionId: event.transactionId,
      topic: TRANSACTION_EVENTS_TOPIC,
    });
  }

  async publishRaw(
    eventId: string,
    eventType: string,
    aggregateId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const message = {
      key: aggregateId,
      value: JSON.stringify({
        eventId,
        eventType,
        aggregateId,
        ...payload,
        timestamp: new Date().toISOString(),
      }),
      headers: {
        eventType,
        eventId,
        timestamp: new Date().toISOString(),
      },
    };

    await this.producer.send({
      topic: TRANSACTION_EVENTS_TOPIC,
      messages: [message],
    });

    this.logger.info('Raw event published to Kafka', {
      eventId,
      eventType,
      aggregateId,
      topic: TRANSACTION_EVENTS_TOPIC,
    });
  }
}
