import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransactionEventType } from '../../../domain/enums';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Entity('transaction_events')
export class TransactionEventOrmEntity {
  @PrimaryColumn('uuid', { name: 'event_id' })
  eventId: string;

  @Column({
    type: 'enum',
    enum: TransactionEventType,
  })
  type: TransactionEventType;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('jsonb')
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => TransactionOrmEntity, (transaction) => transaction.events)
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionOrmEntity;
}
