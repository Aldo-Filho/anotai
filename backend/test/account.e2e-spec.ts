import { PrismaClient } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import {
  bootTestApp,
  resetTestDatabase,
  session,
  authorized,
  password,
} from "./helpers";
let app: INestApplication;
const db = new PrismaClient();
beforeAll(async () => {
  await resetTestDatabase(db);
  app = await bootTestApp();
});
afterAll(async () => {
  await app?.close();
  await db.$disconnect();
});
it("corrige e-mail apenas com a senha e exporta sem credenciais", async () => {
  const s = app.getHttpServer();
  const auth = await session(s);
  await authorized(s, "patch", "/api/users/me", auth)
    .send({ email: "edited@example.test", password: "senha-errada" })
    .expect(403);
  await authorized(s, "patch", "/api/users/me", auth)
    .send({ email: "EDITED@example.test", password })
    .expect(200);
  const got = await authorized(s, "get", "/api/users/me", auth).expect(200);
  expect(got.body.email).toBe("edited@example.test");
  const result = await authorized(
    s,
    "get",
    "/api/users/me/export",
    auth,
  ).expect(200);
  expect(JSON.stringify(result.body)).not.toMatch(
    /passwordHash|anotai_auth|csrfToken/,
  );
  expect(result.body.user.email).toBe("edited@example.test");
});
it("exclusão exige confirmação e remove os dados da conta", async () => {
  const s = app.getHttpServer();
  const auth = await session(s);
  await authorized(s, "post", "/api/categories", auth)
    .send({ name: "Pessoal", type: "EXPENSE" })
    .expect(201);
  await authorized(s, "delete", "/api/users/me", auth)
    .send({ password, confirm: false })
    .expect(400);
  await authorized(s, "delete", "/api/users/me", auth)
    .send({ password: "errada", confirm: true })
    .expect(403);
  await authorized(s, "delete", "/api/users/me", auth)
    .send({ password, confirm: true })
    .expect(200);
  expect(await db.user.count({ where: { id: auth.user.id } })).toBe(0);
  expect(await db.category.count({ where: { userId: auth.user.id } })).toBe(0);
  expect(await db.category.count({ where: { userId: null } })).toBe(13);
  await authorized(s, "get", "/api/users/me", auth).expect(401);
});
