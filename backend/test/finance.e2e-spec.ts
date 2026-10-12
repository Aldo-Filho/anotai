import { PrismaClient } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { bootTestApp, resetTestDatabase, session, authorized } from "./helpers";
let app: INestApplication;
const db = new PrismaClient();
let a: Awaited<ReturnType<typeof session>>, b: typeof a;
const expense = "00000000-0000-4000-8000-000000000001",
  income = "00000000-0000-4000-8000-000000000009";
beforeAll(async () => {
  await resetTestDatabase(db);
  app = await bootTestApp();
  a = await session(app.getHttpServer());
  b = await session(app.getHttpServer());
});
beforeEach(async () => {
  await db.transaction.deleteMany();
});
afterAll(async () => {
  await app?.close();
  await db.$disconnect();
});
const expenseData = {
  description: "Almoço",
  amountCents: 1050,
  type: "EXPENSE",
  categoryId: expense,
  date: "2026-10-10",
};
it("categorias privadas, catálogo comum e duplicidade por tipo", async () => {
  const s = app.getHttpServer();
  const created = await authorized(s, "post", "/api/categories", a)
    .send({ name: "Meu pet", type: "EXPENSE" })
    .expect(201);
  await authorized(s, "post", "/api/categories", a)
    .send({ name: " MEU PET ", type: "EXPENSE" })
    .expect(409);
  await authorized(s, "post", "/api/categories", a)
    .send({ name: "alimentação", type: "EXPENSE" })
    .expect(409);
  const list = await authorized(s, "get", "/api/categories", b).expect(200);
  expect(list.body.some((c: any) => c.id === created.body.id)).toBe(false);
  expect(list.body.length).toBe(13);
});
it("CRUD e filtros; resumo preserva os centavos", async () => {
  const s = app.getHttpServer();
  const paid = await authorized(s, "post", "/api/transactions", a)
    .send({ ...expenseData, amountCents: 350 })
    .expect(201);
  for (const amountCents of [1050, 2250])
    await authorized(s, "post", "/api/transactions", a)
      .send({ ...expenseData, type: "INCOME", categoryId: income, amountCents })
      .expect(201);
  const report = await authorized(
    s,
    "get",
    "/api/reports/monthly?month=2026-10",
    a,
  ).expect(200);
  expect(report.body).toMatchObject({
    incomeCents: 3300,
    expenseCents: 350,
    balanceCents: 2950,
  });
  const list = await authorized(
    s,
    "get",
    `/api/transactions?month=2026-10&type=EXPENSE&categoryId=${expense}`,
    a,
  ).expect(200);
  expect(list.body.total).toBe(1);
  await authorized(s, "patch", `/api/transactions/${paid.body.id}`, a)
    .send({ ...expenseData, description: "Almoço editado" })
    .expect(200);
  const got = await authorized(
    s,
    "get",
    `/api/transactions/${paid.body.id}`,
    a,
  ).expect(200);
  expect(got.body.description).toBe("Almoço editado");
  await authorized(s, "delete", `/api/transactions/${paid.body.id}`, a).expect(
    200,
  );
  await authorized(s, "get", `/api/transactions/${paid.body.id}`, a).expect(
    404,
  );
});
it("bloqueia IDs de terceiros em leitura, edição, exclusão e categorias", async () => {
  const s = app.getHttpServer();
  const created = await authorized(s, "post", "/api/transactions", a)
    .send(expenseData)
    .expect(201);
  for (const method of ["get", "patch", "delete"] as const)
    await authorized(s, method, `/api/transactions/${created.body.id}`, b)
      .send(method === "patch" ? expenseData : undefined)
      .expect(404);
  const category = await authorized(s, "post", "/api/categories", a)
    .send({ name: "Privada", type: "EXPENSE" })
    .expect(201);
  await authorized(s, "post", "/api/transactions", b)
    .send({ ...expenseData, categoryId: category.body.id })
    .expect(400);
  const list = await authorized(
    s,
    "get",
    "/api/transactions?month=2026-10",
    b,
  ).expect(200);
  expect(list.body.total).toBe(0);
});
it("rejeita valores inválidos, tipos incompatíveis e datas futuras", async () => {
  const s = app.getHttpServer();
  for (const amountCents of [0, -1, 1.5, 2147483648])
    await authorized(s, "post", "/api/transactions", a)
      .send({ ...expenseData, amountCents })
      .expect(400);
  await authorized(s, "post", "/api/transactions", a)
    .send({ ...expenseData, categoryId: income })
    .expect(400);
  await authorized(s, "post", "/api/transactions", a)
    .send({ ...expenseData, date: "2099-01-01" })
    .expect(400);
  await authorized(s, "post", "/api/transactions", a)
    .send({ ...expenseData, date: "2026-02-30" })
    .expect(400);
  await authorized(s, "get", "/api/transactions?month=invalido", a).expect(400);
});
