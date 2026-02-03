import { Transaction } from '../../../domain/entities';
import { TransactionStatus } from '../../../domain/enums';

export class TransactionResponseDto {
  id: string;
  amount: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.amount = transaction.amount;
    this.currency = transaction.currency;
    this.sourceAccount = transaction.sourceAccount;
    this.destinationAccount = transaction.destinationAccount;
    this.status = transaction.status;
    this.createdAt = transaction.createdAt.toISOString();
    this.updatedAt = transaction.updatedAt.toISOString();
  }
}
