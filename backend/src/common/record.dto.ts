import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { TransactionType } from "@prisma/client";
export const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
export class ListDto {
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class TransactionDto {
  @Transform(trim) @IsString() @Length(1, 120) description!: string;
  @IsInt() @Min(1) @Max(2147483647) amountCents!: number;
  @IsEnum(TransactionType) type!: TransactionType;
  @IsUUID() categoryId!: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
}
export class UpdateTransactionDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 120)
  description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(2147483647) amountCents?: number;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
}
