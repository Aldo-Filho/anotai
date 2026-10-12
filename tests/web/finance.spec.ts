import { test, expect } from "@playwright/test";
import { loginFixture } from "./helpers";
test("registra movimentação e cria categoria sem perder o formulário", async ({
  page,
}) => {
  await loginFixture(page);
  await page.goto("/lancamentos");
  await page
    .getByRole("button", { name: "Novo lançamento", exact: true })
    .click();
  await page.getByLabel("Descrição", { exact: true }).fill("Café na faculdade");
  await page.getByLabel("Valor (R$)", { exact: true }).fill("10,50");
  await page.getByRole("button", { name: "Categoria", exact: true }).click();
  await page
    .getByRole("button", { name: "Criar categoria", exact: true })
    .click();
  await page.getByLabel("Nome da categoria").fill("Faculdade");
  await page
    .getByRole("button", { name: "Salvar categoria", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salvar lançamento", exact: true })
    .click();
  await expect(
    page.getByText("Café na faculdade", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^Faculdade ·/)).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("expense-total")).toContainText("10,50");
  await expect(page.getByTestId("balance-total")).toContainText("10,50");
});
