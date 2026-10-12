import { PrismaClient } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { bootTestApp, resetTestDatabase, session, authorized } from "./helpers";
import { todayInSaoPaulo } from "../src/common/calendar";
let app: INestApplication;
const db = new PrismaClient();
let a: Awaited<ReturnType<typeof session>>, b: typeof a;
const categoryId = "00000000-0000-4000-8000-000000000001";
const fixture = {
  description: "Conta de alimentação",
  amountCents: 10000,
  categoryId,
  dueDate: "2026-10-01",
};
it("filtro de atrasadas preserva os limites do mês escolhido", async () => {
  const s = app.getHttpServer();
  await authorized(s, "post", "/api/bills", a)
    .send({
      ...fixture,
      description: "Conta de setembro",
      dueDate: "2026-09-30",
    })
    .expect(201);
  await authorized(s, "post", "/api/bills", a)
    .send({
      ...fixture,
      description: "Conta de outubro",
      dueDate: "2026-10-01",
    })
    .expect(201);
  const result = await authorized(
    s,
    "get",
    "/api/bills?month=2026-09&status=OVERDUE",
    a,
  ).expect(200);
  expect(result.body.items.map((item: any) => item.description)).toEqual([
    "Conta de setembro",
  ]);
  expect(result.body.total).toBe(1);
});
beforeAll(async () => {
  await resetTestDatabase(db);
  app = await bootTestApp();
  a = await session(app.getHttpServer());
  b = await session(app.getHttpServer());
});
beforeEach(async () => {
  await db.transaction.deleteMany();
  await db.bill.deleteMany();
});
afterAll(async () => {
  await app?.close();
  await db.$disconnect();
});
it("distingue vence hoje, atrasada e pendente sem alterar saldo realizado", async () => {
  const s = app.getHttpServer();
  const late = await authorized(s, "post", "/api/bills", a)
    .send(fixture)
    .expect(201);
  expect(late.body.status).toBe("OVERDUE");
  const today = await authorized(s, "post", "/api/bills", a)
    .send({ ...fixture, dueDate: todayInSaoPaulo() })
    .expect(201);
  expect(today.body.status).toBe("DUE_TODAY");
  const future = await authorized(s, "post", "/api/bills", a)
    .send({ ...fixture, dueDate: "2099-01-01" })
    .expect(201);
  expect(future.body.status).toBe("PENDING");
  const report = await authorized(
    s,
    "get",
    "/api/reports/monthly?month=2026-10",
    a,
  ).expect(200);
  expect(report.body.balanceCents).toBe(0);
  expect(report.body.pendingCents).toBe(20000);
});
it("pagamento em outro mês entra na data do pagamento", async () => {
  const s = app.getHttpServer();
  const bill = await authorized(s, "post", "/api/bills", a)
    .send({ ...fixture, dueDate: "2026-09-30" })
    .expect(201);
  await authorized(s, "post", `/api/bills/${bill.body.id}/payment`, a)
    .send({ paymentDate: "2026-10-01" })
    .expect(200);
  const sept = await authorized(
    s,
    "get",
    "/api/reports/monthly?month=2026-09",
    a,
  ).expect(200);
  expect(sept.body.expenseCents).toBe(0);
  const oct = await authorized(
    s,
    "get",
    "/api/reports/monthly?month=2026-10",
    a,
  ).expect(200);
  expect(oct.body.expenseCents).toBe(10000);
});
it("quitacões simultâneas geram uma despesa e protegem os registros pagos", async () => {
  const s = app.getHttpServer();
  const bill = await authorized(s, "post", "/api/bills", a)
    .send(fixture)
    .expect(201);
  const results = await Promise.all(
    [1, 2].map(() =>
      authorized(s, "post", `/api/bills/${bill.body.id}/payment`, a).send({
        paymentDate: "2026-10-01",
      }),
    ),
  );
  expect(results.map((r) => r.status)).toEqual([200, 200]);
  expect(await db.transaction.count({ where: { billId: bill.body.id } })).toBe(
    1,
  );
  const got = await authorized(
    s,
    "get",
    `/api/bills/${bill.body.id}`,
    a,
  ).expect(200);
  expect(got.body.status).toBe("PAID");
  await authorized(s, "delete", `/api/bills/${bill.body.id}`, a).expect(409);
  await authorized(s, "patch", `/api/bills/${bill.body.id}`, a)
    .send({ description: "Alterada" })
    .expect(409);
  await authorized(
    s,
    "delete",
    `/api/transactions/${got.body.payment.id}`,
    a,
  ).expect(409);
});
it("impede acessos de terceiros, pagamento futuro e datas impossíveis", async () => {
  const s = app.getHttpServer();
  const bill = await authorized(s, "post", "/api/bills", a)
    .send(fixture)
    .expect(201);
  await authorized(s, "get", `/api/bills/${bill.body.id}`, b).expect(404);
  await authorized(s, "post", `/api/bills/${bill.body.id}/payment`, b)
    .send({ paymentDate: "2026-10-01" })
    .expect(404);
  await authorized(s, "post", `/api/bills/${bill.body.id}/payment`, a)
    .send({ paymentDate: "2099-01-01" })
    .expect(400);
  await authorized(s, "post", "/api/bills", a)
    .send({ ...fixture, dueDate: "2026-02-30" })
    .expect(400);
  await authorized(s, "patch", `/api/bills/${bill.body.id}`, a)
    .send({ description: "Nova descrição" })
    .expect(200);
  await authorized(s, "delete", `/api/bills/${bill.body.id}`, a).expect(200);
});
it("erro do banco ao gravar não deixa uma conta paga sem despesa", async () => {
  const s = app.getHttpServer();
  const bill = await authorized(s, "post", "/api/bills", a)
    .send({ ...fixture, description: "rollback-fixture" })
    .expect(201);
  await db.$executeRawUnsafe(
    `CREATE OR REPLACE FUNCTION anotai_test_reject_payment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.description = 'rollback-fixture' THEN RAISE EXCEPTION 'test rollback'; END IF; RETURN NEW; END; $$`,
  );
  await db.$executeRawUnsafe(
    `CREATE TRIGGER anotai_test_payment_failure BEFORE INSERT ON "Transaction" FOR EACH ROW EXECUTE FUNCTION anotai_test_reject_payment()`,
  );
  try {
    const result = await authorized(
      s,
      "post",
      `/api/bills/${bill.body.id}/payment`,
      a,
    )
      .send({ paymentDate: "2026-10-01" })
      .expect(500);
    expect(JSON.stringify(result.body)).not.toContain("rollback");
    const got = await authorized(
      s,
      "get",
      `/api/bills/${bill.body.id}`,
      a,
    ).expect(200);
    expect(got.body.status).toBe("OVERDUE");
    expect(got.body.payment).toBeNull();
    expect(
      await db.transaction.count({ where: { billId: bill.body.id } }),
    ).toBe(0);
  } finally {
    await db.$executeRawUnsafe(
      'DROP TRIGGER anotai_test_payment_failure ON "Transaction"',
    );
    await db.$executeRawUnsafe("DROP FUNCTION anotai_test_reject_payment()");
  }
});
