import { Page, expect } from "@playwright/test";
export async function loginFixture(page: Page) {
  const email = `fixture-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const data = { email, password: "Senha-segura-123" };
  const register = await page.request.post(
    "http://localhost:3000/api/auth/register",
    { headers: { Origin: "http://localhost:3000" }, data },
  );
  expect(register.status()).toBe(201);
  const login = await page.request.post(
    "http://localhost:3000/api/auth/login",
    { headers: { Origin: "http://localhost:3000" }, data },
  );
  expect(login.status()).toBe(200);
  return email;
}
