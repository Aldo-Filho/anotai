import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CategoriesService } from "../categories/categories.service";
import {
  ListDto,
  TransactionDto,
  UpdateTransactionDto,
} from "../common/record.dto";
import { asDate, dateOnly, monthRange } from "../common/record";
import { Prisma } from "@prisma/client";
const serialize = (row: any) => ({ ...row, date: dateOnly(row.date) });
@Injectable()
export class TransactionsService {
  constructor(
    private readonly db: PrismaService,
    private readonly categories: CategoriesService,
  ) {}
  async list(userId: string, q: ListDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(q.month ? { date: monthRange(q.month) } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
    };
    const [rows, total] = await this.db.$transaction([
      this.db.transaction.findMany({
        where,
        include: { category: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.transaction.count({ where }),
    ]);
    return {
      items: rows.map(serialize),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
  async get(userId: string, id: string) {
    const row = await this.db.transaction.findFirst({
      where: { userId, id },
      include: { category: true },
    });
    if (!row) throw new NotFoundException("Lançamento não encontrado.");
    return serialize(row);
  }
  async create(userId: string, dto: TransactionDto) {
    await this.categories.assertAvailable(userId, dto.categoryId, dto.type);
    return serialize(
      await this.db.transaction.create({
        data: { ...dto, userId, date: asDate(dto.date) },
        include: { category: true },
      }),
    );
  }
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const row = await this.get(userId, id);
    if (row.billId)
      throw new ConflictException(
        "Este lançamento está vinculado a uma conta paga.",
      );
    const merged = { ...row, ...dto };
    await this.categories.assertAvailable(
      userId,
      merged.categoryId,
      merged.type,
    );
    return serialize(
      await this.db.transaction.update({
        where: { id },
        data: {
          description: merged.description,
          amountCents: merged.amountCents,
          type: merged.type,
          categoryId: merged.categoryId,
          date: asDate(merged.date),
        },
        include: { category: true },
      }),
    );
  }
  async remove(userId: string, id: string) {
    const row = await this.get(userId, id);
    if (row.billId)
      throw new ConflictException(
        "Este lançamento está vinculado a uma conta paga.",
      );
    await this.db.transaction.delete({ where: { id } });
    return { message: "Lançamento excluído." };
  }
}
