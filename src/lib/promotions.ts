import "server-only";
import { prisma } from "@/lib/db";

export { calcDiscount, addDays, publicDealWhere, PUBLIC_BUSINESS_WHERE, decimalToNumber } from "@/lib/discount";

// Expires anything whose end date/expiry date has passed. Safe to call
// repeatedly (idempotent) — from a scheduled job, an admin action, or
// opportunistically before rendering admin lists. Read-path queries also
// filter by date directly so nothing stale is ever shown even if this
// sweep hasn't run recently.
export async function sweepExpired() {
  const now = new Date();

  const [deals, subs, featured, boosts, sponsored, ads] = await prisma.$transaction([
    prisma.deal.updateMany({
      where: { status: "APPROVED", expiryDate: { lte: now } },
      data: { status: "EXPIRED" },
    }),
    prisma.subscription.updateMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      data: { status: "EXPIRED" },
    }),
    prisma.featuredBusiness.updateMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      data: { status: "EXPIRED" },
    }),
    prisma.dealBoost.updateMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      data: { status: "EXPIRED" },
    }),
    prisma.sponsoredDeal.updateMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      data: { status: "EXPIRED" },
    }),
    prisma.advertisingPlacement.updateMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      data: { status: "EXPIRED" },
    }),
  ]);

  return {
    deals: deals.count,
    subscriptions: subs.count,
    featured: featured.count,
    boosts: boosts.count,
    sponsored: sponsored.count,
    ads: ads.count,
  };
}
