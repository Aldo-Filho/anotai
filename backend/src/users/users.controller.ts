import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthRequest, JwtGuard } from "../auth/jwt.guard";
import { CsrfGuard } from "../auth/csrf.guard";
import { UsersService } from "./users.service";
import { UpdateAccountDto, DeleteAccountDto } from "./account.dto";
import { Response } from "express";
import { cookieOptions } from "../auth/auth.controller";
@Controller("users")
@UseGuards(JwtGuard, CsrfGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get("me") me(@Req() req: AuthRequest) {
    return { id: req.user.id, email: req.user.email };
  }
  @Patch("me") update(@Req() req: AuthRequest, @Body() dto: UpdateAccountDto) {
    return this.service.update(req.user.id, dto.email, dto.password);
  }
  @Get("me/export") export(@Req() req: AuthRequest) {
    return this.service.export(req.user.id);
  }
  @Delete("me") async remove(
    @Req() req: AuthRequest,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.remove(req.user.id, dto.password);
    const { maxAge, ...options } = cookieOptions();
    res.clearCookie("anotai_auth", options);
    res.clearCookie("anotai_csrf", { ...options, httpOnly: false });
    return result;
  }
}
