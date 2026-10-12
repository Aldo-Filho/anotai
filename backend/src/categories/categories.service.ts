import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, TransactionType } from "@prisma/client";
import { CategoryDto } from "./category.dto";
@Injectable()
export class CategoriesService {
  constructor(private readonly db: PrismaService) {}
  list(userId: string) {
    return this.db.category.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }
  async create(userId: string, dto: CategoryDto) {
    const normalizedName = dto.name.normalize("NFC").toLocaleLowerCase("pt-BR");
    const existing = await this.db.category.findFirst({
      where: {
        normalizedName,
        type: dto.type,
        OR: [{ userId: null }, { userId }],
      },
    });
    if (existing)
      throw new ConflictException(
        "Já existe uma categoria com esse nome e tipo.",
      );
    try {
      return await this.db.category.create({
        data: { ...dto, normalizedName, userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException(
          "Já existe uma categoria com esse nome e tipo.",
        );
      throw error;
    }
  }
  async assertAvailable(userId: string, id: string, type: TransactionType) {
    const category = await this.db.category.findFirst({
      where: { id, type, OR: [{ userId: null }, { userId }] },
    });
    if (!category)
      throw new BadRequestException(
        "Escolha uma categoria disponível para esse tipo.",
      );
    return category;
  }
}
