import { IsNotEmpty, IsNumber, IsPositive, IsString, Length } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  currency!: string;

  @IsString()
  @IsNotEmpty()
  sourceAccount!: string;

  @IsString()
  @IsNotEmpty()
  destinationAccount!: string;
}
