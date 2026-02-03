import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  OutboxRepository,
  OutboxEvent,
} from '../../../application/ports/outbox.port';
import { OutboxEventOrmEntity, OutboxStatus } from '../entities';

@Injectable()
export class TypeOrmOutboxRepository implements OutboxRepository {
  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly repo: Repository<OutboxEventOrmEntity>,
  ) {}

  async save(event: OutboxEvent): Promise<void> {
    const entity = new OutboxEventOrmEntity();
    entity.eventId = event.eventId;
    entity.aggregateType = event.aggregateType;
    entity.aggregateId = event.aggregateId;
    entity.eventType = event.eventType;
    entity.payload = event.payload;
    entity.status = OutboxStatus.PENDING;
    entity.retryCount = 0;

    await this.repo.save(entity);
  }

  async findPendingEvents(limit: number): Promise<OutboxEvent[]> {
    const entities = await this.repo.find({
      where: [
        { status: OutboxStatus.PENDING },
        { status: OutboxStatus.FAILED },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    });

    return entities.map((e) => ({
      eventId: e.eventId,
      aggregateType: e.aggregateType,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: e.payload,
    }));
  }

  async markAsProcessing(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    await this.repo.update(
      { eventId: In(eventIds) },
      { status: OutboxStatus.PROCESSING },
    );
  }

  async markAsCompleted(eventId: string): Promise<void> {
    await this.repo.update(
      { eventId },
      {
        status: OutboxStatus.COMPLETED,
        processedAt: new Date(),
      },
    );
  }

  async markAsFailed(eventId: string, error: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(OutboxEventOrmEntity)
      .set({
        status: OutboxStatus.FAILED,
        lastError: error,
        retryCount: () => 'retry_count + 1',
      })
      .where('event_id = :eventId', { eventId })
      .execute();
  }
}
