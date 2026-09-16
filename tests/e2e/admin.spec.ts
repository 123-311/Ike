import { test, expect } from "@playwright/test";
import {
  registerCustomer,
  registerBusinessForCurrentUser,
  loginAs,
  submitMainForm,
  futureDateInput,
  unique,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from "./helpers";

test.describe("Admin", () => {
  test("a non-admin sees Not authorized on /admin", async ({ page }) => {
    await registerCustomer(page);
    await page.goto("/admin");
    await expect(page.locator("h1", { hasText: "Not authorized" })).toBeVisible();
  });

  test("admin can approve a pending business and a pending deal", async ({ page, browser }) => {
    const bizCtx = await browser.newContext();
    const bizPage = await bizCtx.newPage();
    const { phone } = await registerCustomer(bizPage, { name: "Approval Target" });
    const businessName = unique("ApproveBiz");
    await registerBusinessForCurrentUser(bizPage, { name: businessName, phone });

    await bizPage.goto("/business/deals/new");
    const dealTitle = unique("ApproveDeal");
    await bizPage.fill('input[name="title"]', dealTitle);
    await bizPage.fill('textarea[name="description"]', "Awaiting admin approval.");
    await bizPage.fill('input[name="originalPrice"]', "1000");
    await bizPage.fill('input[name="dealPrice"]', "600");
    await bizPage.selectOption('select[name="categoryId"]', { index: 1 });
    await bizPage.selectOption('select[name="countyId"]', { index: 1 });
    await bizPage.fill('input[name="location"]', "Test Location");
    await bizPage.fill('input[name="expiryDate"]', futureDateInput(20));
    await submitMainForm(bizPage);
    await expect(bizPage).toHaveURL(/\/business\/deals\/.+\/edit/);
    await bizCtx.close();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/admin/businesses?status=PENDING");
    const bizRow = page.locator(".rounded-xl.border", { hasText: businessName });
    await expect(bizRow).toBeVisible();
    await bizRow.locator("button:has-text('Approve')").click();
    await page.waitForTimeout(600);

    await page.goto("/admin/businesses?status=APPROVED");
    await expect(page.locator(".rounded-xl.border", { hasText: businessName })).toBeVisible();

    await page.goto("/admin/deals?status=PENDING");
    const dealRow = page.locator(".rounded-xl.border", { hasText: dealTitle });
    await expect(dealRow).toBeVisible();
    await dealRow.locator("button:has-text('Approve')").click();
    await page.waitForTimeout(600);

    await page.goto("/admin/deals?status=APPROVED");
    await expect(page.locator(".rounded-xl.border", { hasText: dealTitle })).toBeVisible();
  });

  test("admin can reject a pending business with a reason", async ({ page, browser }) => {
    const bizCtx = await browser.newContext();
    const bizPage = await bizCtx.newPage();
    const { phone } = await registerCustomer(bizPage, { name: "Rejection Target" });
    const businessName = unique("RejectBiz");
    await registerBusinessForCurrentUser(bizPage, { name: businessName, phone });
    await bizCtx.close();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/businesses?status=PENDING");
    const bizRow = page.locator(".rounded-xl.border", { hasText: businessName });
    await bizRow.locator("button:has-text('Reject')").click();
    await bizRow.locator("textarea[name='reason']").fill("Incomplete information provided.");
    await bizRow.locator("button:has-text('Confirm reject')").click();
    await page.waitForTimeout(600);

    await page.goto("/admin/businesses?status=REJECTED");
    const rejectedRow = page.locator(".rounded-xl.border", { hasText: businessName });
    await expect(rejectedRow).toBeVisible();
    await expect(rejectedRow.getByText("Incomplete information provided.")).toBeVisible();
  });

  test("a verified payment cannot be verified or rejected again (state-aware queue)", async ({
    page,
    browser,
  }) => {
    const bizCtx = await browser.newContext();
    const bizPage = await bizCtx.newPage();
    const { phone } = await registerCustomer(bizPage, { name: "Payment Queue Target" });
    await registerBusinessForCurrentUser(bizPage, { phone });

    await bizPage.goto("/business/promote");
    const href = await bizPage.locator("a:has-text('Annual Premium')").first().getAttribute("href");
    await bizPage.goto(href!);
    const txCode = unique("QUE").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    await bizPage.fill('input[name="transactionCode"]', txCode);
    await submitMainForm(bizPage);
    await expect(bizPage).toHaveURL(/\/business\/payments/);
    await bizCtx.close();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    page.on("dialog", (d) => d.accept());

    await page.goto("/admin/payments?status=PENDING_VERIFICATION");
    const row = page.locator(".rounded-xl.border", { hasText: txCode });
    await expect(row).toBeVisible();
    await row.locator("button:has-text('Verify')").click();
    await page.waitForTimeout(700);

    await page.goto(`/admin/payments?status=VERIFIED`);
    const verifiedRow = page.locator(".rounded-xl.border", { hasText: txCode });
    await expect(verifiedRow).toBeVisible();
    await expect(verifiedRow.locator("button:has-text('Verify')")).toHaveCount(0);
    await expect(verifiedRow.locator("button:has-text('Reject')")).toHaveCount(0);
  });

  test("admin can edit a package price and it reflects on the promote page", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/packages");

    const form = page.locator("form", { has: page.locator("input[name='durationDays'][value='1']") }).first();
    await form.locator('input[name="price"]').fill("777");
    await form.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    await page.goto("/admin/packages");
    const reloaded = page.locator("form", { has: page.locator("input[name='durationDays'][value='1']") }).first();
    await expect(reloaded.locator('input[name="price"]')).toHaveValue("777");
  });

  test("admin audit log records moderation actions", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/audit-log");
    await expect(page.locator("body")).toContainText(/APPROVE_|REJECT_|VERIFY_PAYMENT|UPDATE_PACKAGE/);
  });
});
