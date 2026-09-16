import { test, expect } from "@playwright/test";
import { registerCustomer, loginAs, submitMainForm, unique, uniquePhone } from "./helpers";

test.describe("Authentication", () => {
  test("a visitor can register, is signed in, and can log out", async ({ page }) => {
    const { email } = await registerCustomer(page, { name: "Authflowtester" });

    // Header shows the signed-in state (first name) and a logout control.
    await expect(page.locator("text=Authflowtester").first()).toBeVisible();

    await page.locator('form:has-text("Log out") button[type="submit"]').click();
    await page.waitForURL("/", { timeout: 10_000 });
    await expect(page.locator('a:has-text("Log in")')).toBeVisible();

    // And can log back in with the same credentials.
    await loginAs(page, email, "StrongPass123");
    await expect(page.locator("text=Authflowtester").first()).toBeVisible();
  });

  test("rejects a duplicate email on registration", async ({ page }) => {
    const { email } = await registerCustomer(page);
    await page.locator('form:has-text("Log out") button[type="submit"]').click();
    await page.waitForURL("/", { timeout: 10_000 });

    await page.goto("/register");
    await page.fill('input[name="name"]', "Duplicate Attempt");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', uniquePhone());
    await page.fill('input[name="password"]', "AnotherPass123");
    await submitMainForm(page);

    await expect(page.locator("text=already exists")).toBeVisible();
  });

  test("rejects an invalid password on login", async ({ page }) => {
    const { email } = await registerCustomer(page);
    await page.locator('form:has-text("Log out") button[type="submit"]').click();
    await page.waitForURL("/", { timeout: 10_000 });

    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "WrongPassword1");
    await submitMainForm(page);

    await expect(page.locator("text=Invalid email or password")).toBeVisible();
  });

  test("unauthenticated users are redirected away from protected pages", async ({ page }) => {
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/business");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
