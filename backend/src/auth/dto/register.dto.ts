import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";
export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
}
export class LoginDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
}
