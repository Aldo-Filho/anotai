import { test, expect } from "@playwright/test";
test("tema manual persiste e é aplicado à tela de login", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Tema escuro", exact: true }).click();
  await expect(page.getByTestId("theme-root")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await page.reload();
  await expect(page.getByTestId("theme-root")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await page.getByRole("button", { name: "Tema claro", exact: true }).click();
  await expect(page.getByTestId("theme-root")).toHaveAttribute(
    "data-theme",
    "light",
  );
});
