import { test, expect } from "@playwright/test";
test("cadastro, login e recarregamento preservam autenticação", async ({
  page,
}) => {
  const email = `web-${Date.now()}@example.test`;
  await page.goto("/cadastro");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123");
  await page.getByLabel("Confirmar senha").fill("Senha-segura-123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Saldo do mês", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Saldo do mês", { exact: true })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "anotai_auth")?.httpOnly).toBe(true);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => /token|jwt|auth/i.test(k)),
    ),
  ).toBe(false);
});
