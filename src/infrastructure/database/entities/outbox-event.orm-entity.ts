import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('outbox_events')
@Index(['status', 'createdAt'])
export class OutboxEventOrmEntity {
  @PrimaryColumn('uuid', { name: 'event_id' })
  eventId: string;

  @Column({ name: 'aggregate_type', length: 100 })
  aggregateType: string;

  @Column('uuid', { name: 'aggregate_id' })
  aggregateId: string;

  @Column({ name: 'event_type', length: 100 })
  eventType: string;

  @Column('jsonb')
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  status: OutboxStatus;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;
}
