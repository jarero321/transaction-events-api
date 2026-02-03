import { v4 as uuidv4 } from 'uuid';
import { TransactionStatus } from '../enums';

export interface TransactionProps {
  id?: string;
  amount: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  status?: TransactionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Transaction {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly sourceAccount: string;
  readonly destinationAccount: string;
  private _status: TransactionStatus;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TransactionProps) {
    this.id = props.id ?? uuidv4();
    this.amount = props.amount;
    this.currency = props.currency;
    this.sourceAccount = props.sourceAccount;
    this.destinationAccount = props.destinationAccount;
    this._status = props.status ?? TransactionStatus.PENDING;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  markAsProcessing(): void {
    this._status = TransactionStatus.PROCESSING;
    this._updatedAt = new Date();
  }

  markAsCompleted(): void {
    this._status = TransactionStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  markAsFailed(): void {
    this._status = TransactionStatus.FAILED;
    this._updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      amount: this.amount,
      currency: this.currency,
      sourceAccount: this.sourceAccount,
      destinationAccount: this.destinationAccount,
      status: this._status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  static fromJSON(data: Record<string, unknown>): Transaction {
    return new Transaction({
      id: data.id as string,
      amount: data.amount as number,
      currency: data.currency as string,
      sourceAccount: data.sourceAccount as string,
      destinationAccount: data.destinationAccount as string,
      status: data.status as TransactionStatus,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
    });
  }
}
