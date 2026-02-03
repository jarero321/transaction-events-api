import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionEvent } from '../../../domain/entities';
import {
  TransactionRepository,
  SaveWithEventOptions,
  UpdateWithEventOptions,
} from '../../../application/ports/transaction-repository.port';
import {
  IDEMPOTENCY_SERVICE,
  IdempotencyService,
} from '../../../application/ports/idempotency.port';
import {
  TransactionOrmEntity,
  TransactionEventOrmEntity,
  OutboxEventOrmEntity,
  OutboxStatus,
} from '../entities';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly transactionRepo: Repository<TransactionOrmEntity>,
    @InjectRepository(TransactionEventOrmEntity)
    private readonly eventRepo: Repository<TransactionEventOrmEntity>,
    private readonly dataSource: DataSource,
    @Inject(IDEMPOTENCY_SERVICE)
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async saveWithEvent(options: SaveWithEventOptions): Promise<void> {
    const { transaction, event, idempotencyKey } = options;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(
        TransactionOrmEntity,
        this.toOrmEntity(transaction),
      );

      await queryRunner.manager.save(
        TransactionEventOrmEntity,
        this.toEventOrmEntity(event),
      );

      await queryRunner.manager.save(OutboxEventOrmEntity, {
        eventId: uuidv4(),
        aggregateType: 'Transaction',
        aggregateId: transaction.id,
        eventType: event.type,
        payload: event.toJSON(),
        status: OutboxStatus.PENDING,
        retryCount: 0,
      });

      if (idempotencyKey) {
        await this.idempotencyService.save({
          idempotencyKey,
          transactionId: transaction.id,
          response: transaction.toJSON(),
        });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateWithEvent(options: UpdateWithEventOptions): Promise<void> {
    const { transaction, event } = options;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(
        TransactionOrmEntity,
        this.toOrmEntity(transaction),
      );

      await queryRunner.manager.save(
        TransactionEventOrmEntity,
        this.toEventOrmEntity(event),
      );

      await queryRunner.manager.save(OutboxEventOrmEntity, {
        eventId: uuidv4(),
        aggregateType: 'Transaction',
        aggregateId: transaction.id,
        eventType: event.type,
        payload: event.toJSON(),
        status: OutboxStatus.PENDING,
        retryCount: 0,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async save(transaction: Transaction): Promise<Transaction> {
    await this.transactionRepo.save(this.toOrmEntity(transaction));
    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.transactionRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const entities = await this.transactionRepo.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllPaginated(limit: number, offset: number): Promise<[Transaction[], number]> {
    const [entities, total] = await this.transactionRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return [entities.map((e) => this.toDomain(e)), total];
  }

  async update(transaction: Transaction): Promise<Transaction> {
    await this.transactionRepo.save(this.toOrmEntity(transaction));
    return transaction;
  }

  async saveEvent(event: TransactionEvent): Promise<TransactionEvent> {
    await this.eventRepo.save(this.toEventOrmEntity(event));
    return event;
  }

  async findEventsByTransactionId(transactionId: string): Promise<TransactionEvent[]> {
    const entities = await this.eventRepo.find({
      where: { transactionId },
      order: { timestamp: 'ASC' },
    });
    return entities.map((e) => this.toEventDomain(e));
  }

  private toOrmEntity(domain: Transaction): TransactionOrmEntity {
    const entity = new TransactionOrmEntity();
    entity.id = domain.id;
    entity.amount = domain.amount;
    entity.currency = domain.currency;
    entity.sourceAccount = domain.sourceAccount;
    entity.destinationAccount = domain.destinationAccount;
    entity.status = domain.status;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  private toDomain(entity: TransactionOrmEntity): Transaction {
    return new Transaction({
      id: entity.id,
      amount: Number(entity.amount),
      currency: entity.currency,
      sourceAccount: entity.sourceAccount,
      destinationAccount: entity.destinationAccount,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEventOrmEntity(domain: TransactionEvent): TransactionEventOrmEntity {
    const entity = new TransactionEventOrmEntity();
    entity.eventId = domain.eventId;
    entity.type = domain.type;
    entity.transactionId = domain.transactionId;
    entity.payload = domain.payload;
    entity.timestamp = domain.timestamp;
    return entity;
  }

  private toEventDomain(entity: TransactionEventOrmEntity): TransactionEvent {
    return new TransactionEvent({
      eventId: entity.eventId,
      type: entity.type,
      transactionId: entity.transactionId,
      payload: entity.payload,
      timestamp: entity.timestamp,
    });
  }
}
