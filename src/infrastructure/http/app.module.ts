import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { HealthController, TransactionController, MetricsController } from './controllers';
import { KafkaModule } from '../kafka/kafka.module';
import { ObservabilityModule } from '../observability/observability.module';
import { DatabaseModule } from '../database/database.module';
import {
  CreateTransactionUseCase,
  GetTransactionUseCase,
  ListTransactionsUseCase,
} from '../../application/use-cases';

@Module({
  imports: [ObservabilityModule, KafkaModule, DatabaseModule],
  controllers: [HealthController, TransactionController, MetricsController],
  providers: [
    CreateTransactionUseCase,
    GetTransactionUseCase,
    ListTransactionsUseCase,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
