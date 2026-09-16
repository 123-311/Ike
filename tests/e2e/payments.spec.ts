import { test, expect } from "@playwright/test";
import { registerCustomer, registerBusinessForCurrentUser, submitMainForm, unique } from "./helpers";

test.describe("M-PESA manual payment flow", () => {
  test("submitting a payment never auto-activates the promotion, and shows pending-verification messaging", async ({
    page,
  }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    await page.goto("/business/promote");
    const href = await page.locator("a:has-text('Annual Premium')").first().getAttribute("href");
    await page.goto(href!);

    const body = await page.locator("main").innerText();
    expect(body).toContain("KSh 4,000");
    expect(body.toLowerCase()).not.toContain("payment successful");

    const txCode = unique("TX").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    await page.fill('input[name="transactionCode"]', txCode);
    await submitMainForm(page);

    await expect(page).toHaveURL(/\/business\/payments/);
    await expect(page.locator("text=submitted for verification")).toBeVisible();
    await expect(page.locator("text=PENDING VERIFICATION")).toBeVisible();

    // Dashboard must not show an active subscription yet.
    await page.goto("/business");
    await expect(page.locator("text=Not subscribed")).toBeVisible();
  });

  test("the same M-PESA transaction code cannot be submitted twice", async ({ page }) => {
    const { phone } = await registerCustomer(page);
    await registerBusinessForCurrentUser(page, { phone });

    const txCode = unique("DUP").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

    await page.goto("/business/promote");
    const featuredHref = await page
      .locator("section:has-text('Featured Business') a")
      .first()
      .getAttribute("href");
    await page.goto(featuredHref!);
    await page.fill('input[name="transactionCode"]', txCode);
    await submitMainForm(page);
    await expect(page).toHaveURL(/\/business\/payments/);

    // Submit a second, different package with the SAME transaction code.
    await page.goto("/business/promote");
    const featuredHref2 = await page
      .locator("section:has-text('Featured Business') a")
      .nth(1)
      .getAttribute("href");
    await page.goto(featuredHref2!);
    await page.fill('input[name="transactionCode"]', txCode);
    await submitMainForm(page);

    await expect(page.locator("text=already been submitted")).toBeVisible();
  });
});
