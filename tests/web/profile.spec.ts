import { test, expect } from "@playwright/test";
import { loginFixture } from "./helpers";
test("senha de confirmação incorreta preserva sessão e formulário", async ({
  page,
}) => {
  const email = await loginFixture(page);
  await page.goto("/perfil");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Alterar e-mail", exact: true })
    .click();
  const updated = `updated-${Date.now()}@example.test`;
  await page.getByLabel("Novo e-mail").fill(updated);
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("Senha-errada-123");
  await page
    .getByRole("button", { name: "Salvar e-mail", exact: true })
    .click();
  await expect(
    page.getByText("Senha inválida.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/perfil/);
  await expect(page.getByLabel("Novo e-mail")).toHaveValue(updated);
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("Senha-segura-123");
  await page
    .getByRole("button", { name: "Salvar e-mail", exact: true })
    .click();
  await expect(page.getByText(updated, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir minha conta", exact: true })
    .click();
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("Senha-errada-123");
  await page
    .getByRole("button", { name: "Excluir definitivamente", exact: true })
    .click();
  await expect(
    page.getByText("Senha inválida.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/perfil/);
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("Senha-segura-123");
  await page
    .getByRole("button", { name: "Excluir definitivamente", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
});
test("perfil alterna tema, exporta dados e permite excluir conta", async ({
  page,
}) => {
  const email = await loginFixture(page);
  await page.goto("/perfil");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tema escuro", exact: true }).click();
  await expect(page.getByTestId("theme-root")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar meus dados", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/anotai.*json/);
  await page
    .getByRole("button", { name: "Excluir minha conta", exact: true })
    .click();
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("Senha-segura-123");
  await page
    .getByRole("button", { name: "Excluir definitivamente", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
});
