import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthRequest, JwtGuard } from "../auth/jwt.guard";
import { CsrfGuard } from "../auth/csrf.guard";
import { CategoryDto } from "./category.dto";
import { CategoriesService } from "./categories.service";
@Controller("categories")
@UseGuards(JwtGuard, CsrfGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Get() list(@Req() req: AuthRequest) {
    return this.service.list(req.user.id);
  }
  @Post() create(@Req() req: AuthRequest, @Body() dto: CategoryDto) {
    return this.service.create(req.user.id, dto);
  }
}
