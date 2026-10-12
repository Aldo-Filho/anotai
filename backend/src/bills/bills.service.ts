import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CategoriesService } from "../categories/categories.service";
import { BillDto, UpdateBillDto, BillListDto } from "./bill.dto";
import { Prisma } from "@prisma/client";
import { asDate, dateOnly, monthRange } from "../common/record";
import { todayInSaoPaulo } from "../common/calendar";
const include = { payment: true, category: true };
const serialize = (row: any) => {
  const dueDate = dateOnly(row.dueDate);
  const today = todayInSaoPaulo();
  return {
    ...row,
    dueDate,
    payment: row.payment
      ? { ...row.payment, date: dateOnly(row.payment.date) }
      : null,
    status: row.payment
      ? "PAID"
      : dueDate < today
        ? "OVERDUE"
        : dueDate === today
          ? "DUE_TODAY"
          : "PENDING",
  };
};
@Injectable()
export class BillsService {
  constructor(
    private readonly db: PrismaService,
    private readonly categories: CategoriesService,
  ) {}
  async list(userId: string, q: BillListDto) {
    const today = asDate(todayInSaoPaulo(), true);
    const dueDate: Prisma.DateTimeFilter = {};
    if (q.status === "OVERDUE") dueDate.lt = today;
    if (q.status === "DUE_TODAY") dueDate.equals = today;
    if (q.status === "PENDING") dueDate.gt = today;
    const where: Prisma.BillWhereInput = {
      userId,
      dueDate,
      ...(q.month ? { AND: [{ dueDate: monthRange(q.month) }] } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.status === "PAID"
        ? { payment: { isNot: null } }
        : q.status
          ? { payment: null }
          : {}),
    };
    const [rows, total] = await this.db.$transaction([
      this.db.bill.findMany({
        where,
        include,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.bill.count({ where }),
    ]);
    return {
      items: rows.map(serialize),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
  async get(userId: string, id: string) {
    const row = await this.db.bill.findFirst({
      where: { id, userId },
      include,
    });
    if (!row) throw new NotFoundException("Conta não encontrada.");
    return serialize(row);
  }
  async create(userId: string, dto: BillDto) {
    await this.categories.assertAvailable(userId, dto.categoryId, "EXPENSE");
    return serialize(
      await this.db.bill.create({
        data: { ...dto, userId, dueDate: asDate(dto.dueDate, true) },
        include,
      }),
    );
  }
  private async lock(tx: Prisma.TransactionClient, userId: string, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "Bill" WHERE id=${id} AND "userId"=${userId} FOR UPDATE`,
    );
    if (!rows.length) throw new NotFoundException("Conta não encontrada.");
    return tx.bill.findUniqueOrThrow({ where: { id }, include });
  }
  async update(userId: string, id: string, dto: UpdateBillDto) {
    return this.db.$transaction(async (tx) => {
      const row = await this.lock(tx, userId, id);
      if (row.payment)
        throw new ConflictException("Uma conta paga não pode ser alterada.");
      const merged = { ...row, ...dto };
      await this.categories.assertAvailable(
        userId,
        merged.categoryId,
        "EXPENSE",
      );
      return serialize(
        await tx.bill.update({
          where: { id },
          data: {
            description: merged.description,
            amountCents: merged.amountCents,
            categoryId: merged.categoryId,
            dueDate: dto.dueDate ? asDate(dto.dueDate, true) : row.dueDate,
          },
          include,
        }),
      );
    });
  }
  async remove(userId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      const row = await this.lock(tx, userId, id);
      if (row.payment)
        throw new ConflictException("Uma conta paga não pode ser excluída.");
      await tx.bill.delete({ where: { id } });
      return { message: "Conta excluída." };
    });
  }
  async pay(userId: string, id: string, paymentDate: string) {
    const date = asDate(paymentDate);
    return this.db.$transaction(async (tx) => {
      const row = await this.lock(tx, userId, id);
      if (row.payment) return serialize(row);
      await tx.transaction.create({
        data: {
          userId,
          billId: id,
          description: row.description,
          amountCents: row.amountCents,
          type: "EXPENSE",
          categoryId: row.categoryId,
          date,
        },
      });
      return serialize(
        await tx.bill.findUniqueOrThrow({ where: { id }, include }),
      );
    });
  }
}
