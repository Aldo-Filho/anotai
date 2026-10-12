import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { dateOnly } from "../common/record";
@Injectable()
export class UsersService {
  constructor(private readonly db: PrismaService) {}
  private async verify(userId: string, password: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new UnauthorizedException("Entre na sua conta para continuar.");
    if (!(await argon2.verify(user.passwordHash, password)))
      throw new ForbiddenException("Senha inválida.");
  }
  async update(userId: string, email: string, password: string) {
    await this.verify(userId, password);
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: { email },
        select: { id: true, email: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("Não foi possível atualizar esse e-mail.");
      throw error;
    }
  }
  async export(userId: string) {
    const [user, categories, transactions, bills] = await this.db.$transaction([
      this.db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true },
      }),
      this.db.category.findMany({ where: { userId } }),
      this.db.transaction.findMany({ where: { userId } }),
      this.db.bill.findMany({ where: { userId } }),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      user,
      categories,
      transactions: transactions.map((t) => ({ ...t, date: dateOnly(t.date) })),
      bills: bills.map((b) => ({ ...b, dueDate: dateOnly(b.dueDate) })),
    };
  }
  async remove(userId: string, password: string) {
    await this.verify(userId, password);
    await this.db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.bill.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    return { message: "Conta e dados excluídos." };
  }
}
