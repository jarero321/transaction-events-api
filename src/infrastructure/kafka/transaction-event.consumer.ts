import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { TransactionEventType } from '../../domain/enums';
import { ProcessTransactionUseCase } from '../../application/use-cases';
import { LOGGER_PORT, LoggerPort } from '../../application/ports/logger.port';

const TRANSACTION_EVENTS_TOPIC = 'transaction-events';
const CONSUMER_GROUP_ID = 'transaction-processor';

@Injectable()
export class TransactionEventConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly processTransactionUseCase: ProcessTransactionUseCase,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
  ) {
    this.kafka = new Kafka({
      clientId: 'transaction-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({ groupId: CONSUMER_GROUP_ID });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TRANSACTION_EVENTS_TOPIC, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    this.logger.info('Kafka consumer started', {
      topic: TRANSACTION_EVENTS_TOPIC,
      groupId: CONSUMER_GROUP_ID,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    this.logger.info('Kafka consumer disconnected');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;

    if (!message.value) {
      return;
    }

    const eventType = message.headers?.eventType?.toString();
    const eventId = message.headers?.eventId?.toString();

    this.logger.info('Received event from Kafka', {
      eventId,
      eventType,
      partition: payload.partition,
      offset: message.offset,
    });

    try {
      const eventData = JSON.parse(message.value.toString());

      if (eventType === TransactionEventType.CREATE_TRANSACTION) {
        await this.processTransactionUseCase.execute({
          transactionId: eventData.transactionId || eventData.payload?.id,
        });
      }
    } catch (error) {
      this.logger.error(
        'Failed to process Kafka message',
        error instanceof Error ? error : undefined,
        {
          eventId,
          eventType,
        },
      );
    }
  }
}
