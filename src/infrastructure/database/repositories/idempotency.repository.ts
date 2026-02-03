import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  IdempotencyService,
  IdempotencyRecord,
} from '../../../application/ports/idempotency.port';
import { IdempotencyKeyOrmEntity } from '../entities';

const EXPIRATION_HOURS = 24;

@Injectable()
export class TypeOrmIdempotencyService implements IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKeyOrmEntity)
    private readonly repo: Repository<IdempotencyKeyOrmEntity>,
  ) {}

  async exists(key: string): Promise<IdempotencyRecord | null> {
    const entity = await this.repo.findOne({
      where: { idempotencyKey: key },
    });

    if (!entity) return null;

    if (entity.expiresAt < new Date()) {
      await this.repo.delete({ idempotencyKey: key });
      return null;
    }

    return {
      idempotencyKey: entity.idempotencyKey,
      transactionId: entity.transactionId,
      response: entity.response,
    };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    const entity = new IdempotencyKeyOrmEntity();
    entity.idempotencyKey = record.idempotencyKey;
    entity.transactionId = record.transactionId;
    entity.response = record.response;
    entity.expiresAt = new Date(
      Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000,
    );

    await this.repo.save(entity);
  }

  async cleanup(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
