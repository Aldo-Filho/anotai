import {
  Body,
  Controller,
  Delete,
  Get,
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
import {
  ListDto,
  TransactionDto,
  UpdateTransactionDto,
} from "../common/record.dto";
import { TransactionsService } from "./transactions.service";
@Controller("transactions")
@UseGuards(JwtGuard, CsrfGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}
  @Get() list(@Req() req: AuthRequest, @Query() q: ListDto) {
    return this.service.list(req.user.id, q);
  }
  @Get(":id") get(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.get(req.user.id, id);
  }
  @Post() create(@Req() req: AuthRequest, @Body() dto: TransactionDto) {
    return this.service.create(req.user.id, dto);
  }
  @Patch(":id") update(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.service.update(req.user.id, id, dto);
  }
  @Delete(":id") remove(
    @Req() req: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(req.user.id, id);
  }
}
