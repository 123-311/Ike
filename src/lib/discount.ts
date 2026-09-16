// Pure helpers — no "server-only" guard, no database import — so they can
// be shared by server code, the seed script, and (if ever needed) tests
// that run outside the Next.js server runtime.
import type { Prisma } from "@prisma/client";

export function calcDiscount(originalPrice: number, dealPrice: number) {
  const savings = Math.max(0, originalPrice - dealPrice);
  const discountPercent =
    originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
  return { discountPercent, savings };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Prisma filter fragment for "deals visible to the public right now".
// Used by every customer-facing query so pending/rejected/expired/
// suspended deals (or deals from unapproved businesses) never leak out.
// A function (not a frozen constant) so `expiryDate` is evaluated fresh
// on every call rather than pinned to server-start time.
export function publicDealWhere() {
  return {
    status: "APPROVED" as const,
    expiryDate: { gt: new Date() },
    business: { verificationStatus: "APPROVED" as const },
  };
}

export const PUBLIC_BUSINESS_WHERE = {
  verificationStatus: "APPROVED" as const,
};

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}
