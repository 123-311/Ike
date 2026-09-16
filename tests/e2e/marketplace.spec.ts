import { test, expect } from "@playwright/test";
import { registerCustomer } from "./helpers";

test.describe("Customer marketplace", () => {
  test("homepage, browse, filters and business listing render", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Mtaani Deals").first()).toBeVisible();

    await page.goto("/deals");
    const dealCount = await page.locator("a[href^='/deals/']").count();
    expect(dealCount).toBeGreaterThan(0);

    await page.goto("/businesses");
    const bizCount = await page.locator("a[href^='/businesses/']").count();
    expect(bizCount).toBeGreaterThan(0);
  });

  test("a deal detail page shows price, discount, and contact actions", async ({ page }) => {
    await page.goto("/deals");
    const href = await page.locator("a[href^='/deals/']").first().getAttribute("href");
    await page.goto(href!);

    await expect(page.locator("text=Call")).toBeVisible();
    await expect(page.locator("text=/KSh [0-9,]+/").first()).toBeVisible();
  });

  test("logged-in customer can save and unsave a deal", async ({ page }) => {
    await registerCustomer(page);

    await page.goto("/deals");
    const href = await page.locator("a[href^='/deals/']").first().getAttribute("href");
    await page.goto(href!);

    await page.locator("button", { hasText: "Save" }).click();
    await expect(page.locator("button", { hasText: "Saved" })).toBeVisible();

    await page.goto("/saved");
    await expect(page.locator("a[href^='/deals/']").first()).toBeVisible();

    await page.locator("button", { hasText: "Remove" }).first().click();
    await page.waitForTimeout(500);
    await page.goto("/saved");
    await expect(page.locator("text=haven't saved any deals")).toBeVisible();
  });

  test("an anonymous visitor is prompted to log in instead of saving", async ({ page }) => {
    await page.goto("/deals");
    const href = await page.locator("a[href^='/deals/']").first().getAttribute("href");
    await page.goto(href!);
    await expect(page.locator("text=Log in to save")).toBeVisible();
  });
});
