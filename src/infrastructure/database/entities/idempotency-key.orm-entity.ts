import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('idempotency_keys')
@Index(['expiresAt'])
export class IdempotencyKeyOrmEntity {
  @PrimaryColumn({ name: 'idempotency_key', length: 255 })
  idempotencyKey: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('jsonb')
  response: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
