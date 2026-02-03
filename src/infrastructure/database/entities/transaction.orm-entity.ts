import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TransactionStatus } from '../../../domain/enums';
import { TransactionEventOrmEntity } from './transaction-event.orm-entity';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ name: 'source_account', length: 50 })
  sourceAccount: string;

  @Column({ name: 'destination_account', length: 50 })
  destinationAccount: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TransactionEventOrmEntity, (event) => event.transaction)
  events: TransactionEventOrmEntity[];
}
