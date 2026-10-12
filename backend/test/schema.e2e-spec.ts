import { PrismaClient } from "@prisma/client";
import { seed } from "../prisma/seed";
const db = new PrismaClient();
beforeAll(async () => {
  await db.transaction.deleteMany();
  await db.bill.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
});
afterAll(() => db.$disconnect());
it("carrega 13 categorias comuns e pode repetir o seed", async () => {
  await seed(db);
  await seed(db);
  expect(await db.category.count({ where: { userId: null } })).toBe(13);
});
it("banco rejeita valores negativos, além da validação de API", async () => {
  const user = await db.user.create({
    data: { email: "schema@example.test", passwordHash: "test-only" },
  });
  const category = await db.category.create({
    data: {
      name: "Categoria fixture",
      normalizedName: "categoria fixture",
      type: "EXPENSE",
    },
  });
  await expect(
    db.transaction.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        type: "EXPENSE",
        description: "inválido",
        amountCents: -100,
        date: new Date("2026-10-12"),
      },
    }),
  ).rejects.toThrow();
});
