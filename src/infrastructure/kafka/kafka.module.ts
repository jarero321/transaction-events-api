import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { TransactionEventConsumer } from './transaction-event.consumer';
import { EVENT_PUBLISHER_PORT } from '../../application/ports';
import { ProcessTransactionUseCase } from '../../application/use-cases';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [ObservabilityModule],
  providers: [
    KafkaProducerService,
    {
      provide: EVENT_PUBLISHER_PORT,
      useExisting: KafkaProducerService,
    },
    ProcessTransactionUseCase,
    TransactionEventConsumer,
  ],
  exports: [EVENT_PUBLISHER_PORT, KafkaProducerService, ProcessTransactionUseCase],
})
export class KafkaModule {}
