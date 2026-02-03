import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TransactionOrmEntity,
  TransactionEventOrmEntity,
  OutboxEventOrmEntity,
  IdempotencyKeyOrmEntity,
} from './entities';
import {
  TypeOrmTransactionRepository,
  TypeOrmOutboxRepository,
  TypeOrmIdempotencyService,
} from './repositories';
import { OutboxWorker } from './workers';
import { TRANSACTION_REPOSITORY } from '../../application/ports/transaction-repository.port';
import { IDEMPOTENCY_SERVICE } from '../../application/ports/idempotency.port';
import { OUTBOX_REPOSITORY } from './ports';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'transaction_user',
      password: process.env.DATABASE_PASSWORD || 'transaction_pass',
      database: process.env.DATABASE_NAME || 'transaction_db',
      entities: [
        TransactionOrmEntity,
        TransactionEventOrmEntity,
        OutboxEventOrmEntity,
        IdempotencyKeyOrmEntity,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([
      TransactionOrmEntity,
      TransactionEventOrmEntity,
      OutboxEventOrmEntity,
      IdempotencyKeyOrmEntity,
    ]),
    forwardRef(() => KafkaModule),
  ],
  providers: [
    TypeOrmTransactionRepository,
    {
      provide: TRANSACTION_REPOSITORY,
      useExisting: TypeOrmTransactionRepository,
    },
    TypeOrmOutboxRepository,
    {
      provide: OUTBOX_REPOSITORY,
      useExisting: TypeOrmOutboxRepository,
    },
    TypeOrmIdempotencyService,
    {
      provide: IDEMPOTENCY_SERVICE,
      useExisting: TypeOrmIdempotencyService,
    },
    OutboxWorker,
  ],
  exports: [TRANSACTION_REPOSITORY, IDEMPOTENCY_SERVICE],
})
export class DatabaseModule {}
