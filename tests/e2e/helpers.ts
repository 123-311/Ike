import type { Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@mtaanideals.co.ke";
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "DevAdmin!2026Change";

let counter = 0;
export function unique(tag: string) {
  counter += 1;
  return `${tag}_${Date.now()}_${counter}`;
}

export function uniquePhone() {
  counter += 1;
  const digits = String(Date.now() + counter).slice(-8);
  return `07${digits}`;
}

// Submit the main content form, not the header's logout form (which also
// renders a `button[type="submit"]` on every page once logged in).
export async function submitMainForm(page: Page) {
  await page.locator('main form button[type="submit"]').first().click();
}

export async function registerCustomer(
  page: Page,
  { name = "Test User" }: { name?: string } = {}
) {
  const email = `${unique("user")}@example.com`;
  const phone = uniquePhone();
  const password = "StrongPass123";

  await page.goto("/register");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="phone"]', phone);
  await page.fill('input[name="password"]', password);
  await submitMainForm(page);
  await page.waitForURL("/", { timeout: 10_000 });

  return { email, phone, password };
}

export async function registerBusinessForCurrentUser(
  page: Page,
  { name, phone }: { name?: string; phone: string }
) {
  const businessName = name ?? unique("Biz");
  await page.goto("/business/register");
  await page.fill('input[name="name"]', businessName);
  await page.selectOption('select[name="categoryId"]', { index: 1 });
  await page.selectOption('select[name="countyId"]', { index: 1 });
  await page.fill('input[name="location"]', "Test Location");
  await page.fill('input[name="phone"]', phone);
  await page.fill('textarea[name="description"]', "An automated e2e test business.");
  await submitMainForm(page);
  await page.waitForURL("/business", { timeout: 10_000 });
  return businessName;
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await submitMainForm(page);
  await page.waitForURL("/", { timeout: 10_000 });
}

export function futureDateInput(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}
