import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateTransactionUseCase,
  GetTransactionUseCase,
  ListTransactionsUseCase,
} from '../../../application/use-cases';
import { CreateTransactionDto, TransactionResponseDto } from '../dtos';

@Controller('api/v1/transactions')
export class TransactionController {
  constructor(
    private readonly createUseCase: CreateTransactionUseCase,
    private readonly getUseCase: GetTransactionUseCase,
    private readonly listUseCase: ListTransactionsUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { transaction, cached } = await this.createUseCase.execute({
      amount: dto.amount,
      currency: dto.currency,
      sourceAccount: dto.sourceAccount,
      destinationAccount: dto.destinationAccount,
      idempotencyKey,
    });

    const response = new TransactionResponseDto(transaction);
    const statusCode = cached ? HttpStatus.OK : HttpStatus.CREATED;

    res.status(statusCode).json(response);
  }

  @Get()
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { transactions, total } = await this.listUseCase.execute({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      data: transactions.map((t) => new TransactionResponseDto(t)),
      total,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { transaction } = await this.getUseCase.execute({ id });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return new TransactionResponseDto(transaction);
  }
}
