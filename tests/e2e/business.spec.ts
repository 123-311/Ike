import { test, expect } from "@playwright/test";
import {
  registerCustomer,
  registerBusinessForCurrentUser,
  submitMainForm,
  futureDateInput,
} from "./helpers";

test.describe("Business registration and deal management", () => {
  test("a customer can register a business and it starts Pending Verification", async ({ page }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  });

  test("a business retains normal customer marketplace access", async ({ page }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    // Still able to browse and save deals like any customer.
    await page.goto("/deals");
    await expect(page.locator("a[href^='/deals/']").first()).toBeVisible();
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/saved/);
  });

  test("registering a second business for the same account is blocked", async ({ page }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    await page.goto("/business/register");
    // Owner already has a business, so this redirects straight to the dashboard.
    await expect(page).toHaveURL(/\/business$/);
  });

  test("a business can add a deal with an auto-calculated discount", async ({ page }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    await page.goto("/business/deals/new");
    await page.fill('input[name="title"]', "E2E 50% Off Deal");
    await page.fill('textarea[name="description"]', "Automated end-to-end test deal.");
    await page.fill('input[name="originalPrice"]', "1000");
    await page.fill('input[name="dealPrice"]', "500");
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.selectOption('select[name="countyId"]', { index: 1 });
    await page.fill('input[name="location"]', "Test Location");
    await page.fill('input[name="expiryDate"]', futureDateInput(20));
    await submitMainForm(page);

    await expect(page).toHaveURL(/\/business\/deals\/.+\/edit/);

    await page.goto("/business/deals");
    await expect(page.locator("text=E2E 50% Off Deal")).toBeVisible();
    await expect(page.locator("text=-50%")).toBeVisible();
    await expect(page.locator("text=PENDING")).toBeVisible();
  });

  test("a business cannot submit a deal priced higher than the original price", async ({ page }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    await page.goto("/business/deals/new");
    await page.fill('input[name="title"]', "Invalid Pricing Deal");
    await page.fill('textarea[name="description"]', "This should be rejected by validation.");
    await page.fill('input[name="originalPrice"]', "500");
    await page.fill('input[name="dealPrice"]', "1000");
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.selectOption('select[name="countyId"]', { index: 1 });
    await page.fill('input[name="location"]', "Test Location");
    await page.fill('input[name="expiryDate"]', futureDateInput(20));
    await submitMainForm(page);

    await expect(page.locator("text=lower than the original price")).toBeVisible();
  });

  test("a business cannot access or edit another business's deal", async ({ page, browser }) => {
    const { phone: phoneA } = await registerCustomer(page, { name: "Owner A" });
    await registerBusinessForCurrentUser(page, { phone: phoneA });

    await page.goto("/business/deals/new");
    await page.fill('input[name="title"]', "Owner A Private Deal");
    await page.fill('textarea[name="description"]', "Should not be reachable by Owner B.");
    await page.fill('input[name="originalPrice"]', "1000");
    await page.fill('input[name="dealPrice"]', "500");
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.selectOption('select[name="countyId"]', { index: 1 });
    await page.fill('input[name="location"]', "Test Location");
    await page.fill('input[name="expiryDate"]', futureDateInput(20));
    await submitMainForm(page);
    await expect(page).toHaveURL(/\/business\/deals\/.+\/edit/);
    const dealId = page.url().match(/\/deals\/([^/]+)\/edit/)![1];

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const { phone: phoneB } = await registerCustomer(pageB, { name: "Owner B" });
    await registerBusinessForCurrentUser(pageB, { phone: phoneB });

    const resp = await pageB.goto(`/business/deals/${dealId}/edit`);
    expect(resp!.status()).toBe(404);
    await ctxB.close();
  });
});
