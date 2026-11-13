import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/athlete");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/login$/);
});

test("a wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jordan@goe.test");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("That email and password don't match an account.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email")).toHaveValue("jordan@goe.test");
});

test("athletes and coaches land on their own dashboards and can't cross over", async ({ page }) => {
  await login(page, "jordan@goe.test");
  await expect(page).toHaveURL(/\/athlete$/);
  await expect(page.getByRole("heading", { name: "Hey Jordan" })).toBeVisible();
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/athlete$/);

  await page.getByRole("button", { name: "Log out" }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, "coach@goe.test");
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/athlete");
  await expect(page).toHaveURL(/\/coach$/);
});
