import { Transform } from "class-transformer";
import {
  Equals,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
export class UpdateAccountDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
}
export class DeleteAccountDto {
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
  @Equals(true) confirm!: boolean;
}
