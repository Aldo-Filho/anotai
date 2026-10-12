import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/config/app";
import { PrismaClient } from "@prisma/client";
import { seed } from "../prisma/seed";
import request from "supertest";
import { randomUUID } from "node:crypto";
export const origin = "http://localhost:3000";
export const password = "Senha-segura-123";
export async function bootTestApp() {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
export async function resetTestDatabase(db: PrismaClient) {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test"))
    throw new Error("Banco de teste obrigatório.");
  await db.transaction.deleteMany();
  await db.bill.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
  await seed(db);
}
export async function session(server: any) {
  const email = `${randomUUID()}@example.test`;
  await request(server)
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email, password })
    .expect(201);
  const response = await request(server)
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email, password })
    .expect(200);
  return {
    email,
    user: response.body.user,
    cookie: response.headers["set-cookie"] as unknown as string[],
    csrf: response.body.csrfToken as string,
  };
}
export function authorized(
  server: any,
  method: "get" | "post" | "patch" | "delete",
  path: string,
  auth: { cookie: string[]; csrf: string },
) {
  return request(server)
    [method](path)
    .set("Cookie", auth.cookie)
    .set("Origin", origin)
    .set("X-CSRF-Token", auth.csrf);
}
