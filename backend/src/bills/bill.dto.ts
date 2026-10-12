import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { ListDto, trim } from "../common/record.dto";
export class BillDto {
  @Transform(trim) @IsString() @Length(1, 120) description!: string;
  @IsInt() @Min(1) @Max(2147483647) amountCents!: number;
  @IsUUID() categoryId!: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) dueDate!: string;
}
export class UpdateBillDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 120)
  description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(2147483647) amountCents?: number;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) dueDate?: string;
}
export class PayBillDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) paymentDate!: string;
}
export class BillListDto extends ListDto {
  @IsOptional()
  @IsIn(["PENDING", "DUE_TODAY", "OVERDUE", "PAID", "UNPAID"])
  status?: string;
}
