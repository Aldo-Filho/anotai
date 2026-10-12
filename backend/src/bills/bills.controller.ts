import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthRequest, JwtGuard } from "../auth/jwt.guard";
import { CsrfGuard } from "../auth/csrf.guard";
import { BillsService } from "./bills.service";
import { BillDto, UpdateBillDto, BillListDto, PayBillDto } from "./bill.dto";
@Controller("bills")
@UseGuards(JwtGuard, CsrfGuard)
export class BillsController {
  constructor(private readonly service: BillsService) {}
  @Get() list(@Req() req: AuthRequest, @Query() q: BillListDto) {
    return this.service.list(req.user.id, q);
  }
  @Get(":id") get(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.get(req.user.id, id);
  }
  @Post() create(@Req() req: AuthRequest, @Body() dto: BillDto) {
    return this.service.create(req.user.id, dto);
  }
  @Patch(":id") update(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.service.update(req.user.id, id, dto);
  }
  @Delete(":id") remove(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(req.user.id, id);
  }
  @Post(":id/payment") @HttpCode(200) pay(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: PayBillDto,
  ) {
    return this.service.pay(req.user.id, id, dto.paymentDate);
  }
}
