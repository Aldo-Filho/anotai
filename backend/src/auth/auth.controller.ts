import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/register.dto";
import { JwtGuard } from "./jwt.guard";
import { CsrfGuard } from "./csrf.guard";
import { readConfig } from "../config/env";
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: !readConfig().localDemo,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 28800000,
  };
}
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register") register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password);
    res.cookie("anotai_auth", result.token, cookieOptions());
    res.cookie("anotai_csrf", result.csrfToken, {
      ...cookieOptions(),
      httpOnly: false,
    });
    return { user: result.user, csrfToken: result.csrfToken };
  }
  @Post("logout")
  @HttpCode(200)
  @UseGuards(JwtGuard, CsrfGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge, ...options } = cookieOptions();
    res.clearCookie("anotai_auth", options);
    res.clearCookie("anotai_csrf", { ...options, httpOnly: false });
    return { message: "Você saiu da conta." };
  }
}
