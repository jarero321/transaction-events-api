import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/entities';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../ports';

export interface GetTransactionInput {
  id: string;
}

export interface GetTransactionOutput {
  transaction: Transaction | null;
}

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repository: TransactionRepository,
  ) {}

  async execute(input: GetTransactionInput): Promise<GetTransactionOutput> {
    const transaction = await this.repository.findById(input.id);
    return { transaction };
  }
}
