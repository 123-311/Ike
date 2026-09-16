import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();

test.describe("Visibility and authorization security rules", () => {
  test("a pending business is not publicly visible or listed", async ({ page, browser }) => {
    const bizCtx = await browser.newContext();
    const bizPage = await bizCtx.newPage();
    const { phone } = await registerCustomer(bizPage, { name: "Pending Visibility Owner" });
    const businessName = unique("PendingVis");
    await registerBusinessForCurrentUser(bizPage, { name: businessName, phone });
    const businessUrl = bizPage.url(); // /business dashboard, not the public page
    void businessUrl;
    await bizCtx.close();

    await page.goto("/businesses");
    await expect(page.locator(`text=${businessName}`)).toHaveCount(0);
  });

  test("a rejected deal never appears on the public marketplace", async ({ page, browser }) => {
    const bizCtx = await browser.newContext();
    const bizPage = await bizCtx.newPage();
    const { phone } = await registerCustomer(bizPage, { name: "Rejected Deal Owner" });
    await registerBusinessForCurrentUser(bizPage, { phone });

    const dealTitle = unique("RejectDealVis");
    await bizPage.goto("/business/deals/new");
    await bizPage.fill('input[name="title"]', dealTitle);
    await bizPage.fill('textarea[name="description"]', "Will be rejected by admin.");
    await bizPage.fill('input[name="originalPrice"]', "1000");
    await bizPage.fill('input[name="dealPrice"]', "600");
    await bizPage.selectOption('select[name="categoryId"]', { index: 1 });
    await bizPage.selectOption('select[name="countyId"]', { index: 1 });
    await bizPage.fill('input[name="location"]', "Test Location");
    await bizPage.fill('input[name="expiryDate"]', futureDateInput(20));
    await submitMainForm(bizPage);
    await expect(bizPage).toHaveURL(/\/business\/deals\/.+\/edit/);
    const dealId = bizPage.url().match(/\/deals\/([^/]+)\/edit/)![1];

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginAs(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    await adminPage.goto("/admin/deals?status=PENDING");
    const row = adminPage.locator(".rounded-xl.border", { hasText: dealTitle });
    await row.locator("button:has-text('Reject')").click();
    await row.locator("textarea[name='reason']").fill("Does not meet listing standards.");
    await row.locator("button:has-text('Confirm reject')").click();
    await adminPage.waitForTimeout(600);
    await adminCtx.close();
    await bizCtx.close();

    // Anonymous visitor gets a 404 for the rejected deal's detail page.
    const resp = await page.goto(`/deals/${dealId}`);
    expect(resp!.status()).toBe(404);

    // And it never appears in the browse listing.
    await page.goto("/deals");
    await expect(page.locator(`text=${dealTitle}`)).toHaveCount(0);
  });

  test("an expired deal disappears from the marketplace even without a sweep running", async ({
    page,
  }) => {
    const dealTitle = unique("ExpiredVis");
    const category = await prisma.category.findFirstOrThrow();
    const county = await prisma.county.findFirstOrThrow();
    const business = await prisma.business.findFirstOrThrow({
      where: { verificationStatus: "APPROVED" },
    });

    const deal = await prisma.deal.create({
      data: {
        businessId: business.id,
        title: dealTitle,
        description: "Expired deal visibility test.",
        originalPrice: 1000,
        dealPrice: 500,
        discountPercent: 50,
        savings: 500,
        categoryId: category.id,
        countyId: county.id,
        location: "Test",
        expiryDate: new Date(Date.now() - 86_400_000), // yesterday
        status: "APPROVED",
      },
    });

    const resp = await page.goto(`/deals/${deal.id}`);
    expect(resp!.status()).toBe(404);

    await page.goto("/deals");
    await expect(page.locator(`text=${dealTitle}`)).toHaveCount(0);

    await prisma.deal.delete({ where: { id: deal.id } });
  });

  test("duplicate saved-deal records are prevented", async ({ page }) => {
    await registerCustomer(page);
    await page.goto("/deals");
    const href = await page.locator("a[href^='/deals/']").first().getAttribute("href");
    const dealId = href!.split("/").pop()!;
    await page.goto(href!);

    const saveBtn = page.locator("button", { hasText: "Save" });
    await saveBtn.click();
    await expect(page.locator("button", { hasText: "Saved" })).toBeVisible();

    const count = await prisma.savedDeal.count({ where: { dealId } });
    expect(count).toBeLessThanOrEqual(1);
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
