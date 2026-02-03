import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/entities';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../ports';

export interface ListTransactionsInput {
  limit?: number;
  offset?: number;
}

export interface ListTransactionsOutput {
  transactions: Transaction[];
  total: number;
}

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repository: TransactionRepository,
  ) {}

  async execute(input: ListTransactionsInput = {}): Promise<ListTransactionsOutput> {
    const { limit = 20, offset = 0 } = input;
    const [transactions, total] = await this.repository.findAllPaginated(limit, offset);
    return { transactions, total };
  }
}
