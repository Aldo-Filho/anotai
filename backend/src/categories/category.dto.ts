import { IsEnum, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";
import { TransactionType } from "@prisma/client";
import { trim } from "../common/record.dto";
export class CategoryDto {
  @Transform(trim) @IsString() @Length(1, 50) name!: string;
  @IsEnum(TransactionType) type!: TransactionType;
}
