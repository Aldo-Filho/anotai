import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthRequest, JwtGuard } from "../auth/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";
import { monthRange } from "../common/record";
import { todayInSaoPaulo } from "../common/calendar";
@Controller("reports")
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(private readonly db: PrismaService) {}
  @Get("monthly") async monthly(
    @Req() req: AuthRequest,
    @Query("month") month?: string,
  ) {
    const range = monthRange(month || todayInSaoPaulo().slice(0, 7));
    const [income, expense, pending] = await this.db.$transaction([
      this.db.transaction.aggregate({
        where: { userId: req.user.id, date: range, type: "INCOME" },
        _sum: { amountCents: true },
      }),
      this.db.transaction.aggregate({
        where: { userId: req.user.id, date: range, type: "EXPENSE" },
        _sum: { amountCents: true },
      }),
      this.db.bill.aggregate({
        where: { userId: req.user.id, dueDate: range, payment: null },
        _sum: { amountCents: true },
      }),
    ]);
    const incomeCents = income._sum.amountCents || 0,
      expenseCents = expense._sum.amountCents || 0;
    return {
      incomeCents,
      expenseCents,
      balanceCents: incomeCents - expenseCents,
      pendingCents: pending._sum.amountCents || 0,
    };
  }
}
