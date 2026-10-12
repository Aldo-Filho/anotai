import { test, expect } from "@playwright/test";
import { loginFixture } from "./helpers";
test("build servido pela API permite abrir e recarregar rotas internas", async ({
  page,
}) => {
  await loginFixture(page);
  await page.goto("http://localhost:3000/lancamentos");
  await expect(
    page.getByRole("heading", { name: "Lançamentos", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Lançamentos", exact: true }),
  ).toBeVisible();
  const response = await page.request.get(
    "http://localhost:3000/api/not-a-route",
  );
  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("application/json");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/");
  await expect(page.getByTestId("balance-total")).toContainText("0,00");
  await page.screenshot({ path: "docs/preview-claro.png" });
  await page.goto("http://localhost:3000/perfil");
  await page.getByRole("button", { name: "Tema escuro", exact: true }).click();
  await page.goto("http://localhost:3000/");
  await expect(page.getByTestId("theme-root")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "docs/preview-escuro.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "docs/preview-desktop.png" });
});
