import { test, expect } from "@playwright/test";
import { loginFixture } from "./helpers";
test("conta futura vira despesa somente após registrar pagamento", async ({
  page,
}) => {
  await loginFixture(page);
  await page.goto("/contas");
  await page.getByRole("button", { name: "Nova conta", exact: true }).click();
  await page.getByLabel("Descrição", { exact: true }).fill("Internet da casa");
  await page.getByLabel("Valor (R$)", { exact: true }).fill("100,00");
  await page.getByLabel("Vencimento", { exact: true }).fill("2026-10-20");
  await page.getByRole("button", { name: "Categoria", exact: true }).click();
  await page.getByRole("button", { name: "Moradia", exact: true }).click();
  await page.getByRole("button", { name: "Salvar conta", exact: true }).click();
  await expect(
    page.getByText("Internet da casa", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("expense-total")).toContainText("0,00");
  await page.goto("/contas");
  await page
    .getByRole("button", { name: "Pagar Internet da casa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar pagamento", exact: true })
    .click();
  await expect(page.getByText("Paga", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("expense-total")).toContainText("100,00");
});
