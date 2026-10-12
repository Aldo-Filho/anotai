import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import jwt from "jsonwebtoken";
import {
  bootTestApp,
  resetTestDatabase,
  session,
  origin,
  password,
  authorized,
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
it("cadastra com Argon2id, e-mail normalizado e sem expor hash", async () => {
  const response = await request(app.getHttpServer())
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: "USER@example.test", password })
    .expect(201);
  expect(response.body).toEqual({
    id: expect.any(String),
    email: "user@example.test",
  });
  const user = await db.user.findUniqueOrThrow({
    where: { email: "user@example.test" },
  });
  expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  expect(user.passwordHash).not.toBe(password);
});
it("rejeita senha curta, campos extras e origem desconhecida", async () => {
  await request(app.getHttpServer())
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: "short@example.test", password: "123" })
    .expect(400);
  await request(app.getHttpServer())
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: "extra@example.test", password, userId: "injetado" })
    .expect(400);
  await request(app.getHttpServer())
    .post("/api/auth/login")
    .set("Origin", "http://evil.example")
    .send({ email: "user@example.test", password })
    .expect(403);
});
it("login envia cookie HttpOnly com 8 horas e JSON sem JWT", async () => {
  const auth = await session(app.getHttpServer());
  const cookie = auth.cookie.find((c) => c.startsWith("anotai_auth="))!;
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");
  expect(cookie).toContain("Max-Age=28800");
  const token = cookie.split(";")[0].split("=")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  expect(decoded.exp! - decoded.iat!).toBe(28800);
  await authorized(app.getHttpServer(), "get", "/api/users/me", auth).expect(
    200,
  );
});
it("credenciais erradas e e-mail inexistente usam a mesma resposta", async () => {
  const a = await request(app.getHttpServer())
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: "user@example.test", password: "senha-errada-123" })
    .expect(401);
  const b = await request(app.getHttpServer())
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: "absent@example.test", password })
    .expect(401);
  expect(a.body.message).toBe(b.body.message);
});
it("rejeita token ausente, adulterado e expirado", async () => {
  await request(app.getHttpServer()).get("/api/users/me").expect(401);
  await request(app.getHttpServer())
    .get("/api/users/me")
    .set("Cookie", "anotai_auth=invalid")
    .expect(401);
  const expired = jwt.sign(
    { sub: "fake", jti: "fake" },
    process.env.JWT_SECRET!,
    { expiresIn: -1, issuer: "anotai", audience: "anotai-app" },
  );
  await request(app.getHttpServer())
    .get("/api/users/me")
    .set("Cookie", `anotai_auth=${expired}`)
    .expect(401);
});
it("logout exige CSRF válido e limpa os cookies", async () => {
  const auth = await session(app.getHttpServer());
  await request(app.getHttpServer())
    .post("/api/auth/logout")
    .set("Origin", origin)
    .set("Cookie", auth.cookie)
    .expect(403);
  await request(app.getHttpServer())
    .post("/api/auth/logout")
    .set("Origin", origin)
    .set("Cookie", auth.cookie)
    .set("X-CSRF-Token", "adulterado")
    .expect(403);
  const response = await authorized(
    app.getHttpServer(),
    "post",
    "/api/auth/logout",
    auth,
  ).expect(200);
  expect(
    (response.headers["set-cookie"] as unknown as string[]).join(";"),
  ).toContain("anotai_auth=;");
});
it("usuário excluído não consegue reutilizar cookie antigo", async () => {
  const auth = await session(app.getHttpServer());
  await db.user.delete({ where: { id: auth.user.id } });
  await authorized(app.getHttpServer(), "get", "/api/users/me", auth).expect(
    401,
  );
});
it("CSRF com caracteres não ASCII recebe 403, sem erro interno", async () => {
  const auth = await session(app.getHttpServer());
  const fake = "é".repeat(64);
  const authCookie = auth.cookie.find((c) => c.startsWith("anotai_auth="))!;
  await request(app.getHttpServer())
    .post("/api/auth/logout")
    .set("Origin", origin)
    .set("Cookie", [authCookie, `anotai_csrf=${encodeURIComponent(fake)}`])
    .set("X-CSRF-Token", fake)
    .expect(403);
});
it("limita leituras repetidas da API além das tentativas de login", async () => {
  const isolated = await bootTestApp();
  try {
    let response;
    for (let i = 0; i < 301; i++)
      response = await request(isolated.getHttpServer()).get("/api/users/me");
    expect(response!.status).toBe(429);
    expect(response!.headers["retry-after"]).toBeDefined();
  } finally {
    await isolated.close();
  }
});
it("limita a 10 tentativas por minuto", async () => {
  const rateApp = await bootTestApp();
  const server = rateApp.getHttpServer();
  const statuses = [];
  try {
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await request(server)
            .post("/api/auth/login")
            .set("Origin", origin)
            .send({ email: "rate@example.test", password })
        ).status,
      );
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
    expect(statuses.at(-1)).toBe(429);
  } finally {
    await rateApp.close();
  }
});
it("protege origem também em URLs com caixa ou barra final diferentes", async () => {
  const isolated = await bootTestApp();
  try {
    for (const route of [
      "/API/auth/login",
      "/api/auth/login/",
      "/API/AUTH/LOGIN/",
    ])
      await request(isolated.getHttpServer())
        .post(route)
        .set("Origin", "http://evil.example")
        .send({ email: "absent@example.test", password })
        .expect(403);
    for (const route of ["/API/auth/register", "/api/auth/register/"])
      await request(isolated.getHttpServer())
        .post(route)
        .set("Origin", "http://evil.example")
        .send({ email: "foreign-origin@example.test", password })
        .expect(403);
  } finally {
    await isolated.close();
  }
});
it("variantes de login compartilham o mesmo limite de tentativas", async () => {
  const isolated = await bootTestApp();
  try {
    const routes = ["/api/auth/login", "/API/auth/login", "/api/auth/login/"];
    const statuses = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await request(isolated.getHttpServer())
            .post(routes[i % 3])
            .set("Origin", origin)
            .send({ email: "absent@example.test", password })
        ).status,
      );
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
    expect(statuses[10]).toBe(429);
  } finally {
    await isolated.close();
  }
});
it("variantes de cadastro compartilham o mesmo limite de tentativas", async () => {
  const isolated = await bootTestApp();
  try {
    const routes = [
      "/api/auth/register",
      "/API/auth/register",
      "/api/auth/register/",
    ];
    const statuses = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await request(isolated.getHttpServer())
            .post(routes[i % 3])
            .set("Origin", origin)
            .send({
              email: `register-limit-${i}@example.test`,
              password: "short",
            })
        ).status,
      );
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(400));
    expect(statuses[10]).toBe(429);
  } finally {
    await isolated.close();
  }
});
