import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicDealWhere, PUBLIC_BUSINESS_WHERE } from "@/lib/discount";
import { getSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import DealCard from "@/components/deals/DealCard";

export default async function Home() {
  const now = new Date();
  const tagline = await getSetting(SETTING_KEYS.BRAND_TAGLINE);

  const [latestDeals, boostedDealLinks, featuredBusinesses, categories, counties] =
    await Promise.all([
      prisma.deal.findMany({
        where: publicDealWhere(),
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          business: { select: { id: true, name: true, verificationStatus: true, isDemo: true } },
          category: { select: { name: true } },
          county: { select: { name: true } },
        },
      }),
      prisma.dealBoost.findMany({
        where: { status: "ACTIVE", endDate: { gt: now } },
        select: { dealId: true },
      }),
      prisma.business.findMany({
        where: {
          ...PUBLIC_BUSINESS_WHERE,
          featuredPeriods: { some: { status: "ACTIVE", endDate: { gt: now } } },
        },
        take: 6,
        include: { category: { select: { name: true } }, county: { select: { name: true } } },
      }),
      prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    ]);

  const boostedIds = new Set(boostedDealLinks.map((b) => b.dealId));
  const deals = latestDeals
    .map((d) => ({ ...d, isBoosted: boostedIds.has(d.id) }))
    .sort((a, b) => Number(b.isBoosted) - Number(a.isBoosted));

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-primary text-primary-contrast px-5 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Mtaani Deals</h1>
        <p className="mt-1 text-primary-contrast/90 max-w-md">{tagline}</p>
        <form action="/deals" method="GET" className="mt-5 flex gap-2">
          <input
            name="q"
            placeholder="Search deals, e.g. haircut, pizza..."
            className="flex-1 rounded-lg px-3 py-2.5 text-foreground bg-surface outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent text-accent-contrast font-semibold px-4"
          >
            Search
          </button>
        </form>
      </section>

      <section>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/deals?category=${c.id}`}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {featuredBusinesses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Featured Businesses</h2>
            <Link href="/businesses" className="text-sm text-primary">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4">
            {featuredBusinesses.map((b) => (
              <Link
                key={b.id}
                href={`/businesses/${b.id}`}
                className="shrink-0 w-48 rounded-xl border border-border bg-surface p-3 hover:shadow-md"
              >
                <span className="inline-block rounded-full bg-accent text-accent-contrast text-[10px] font-bold px-2 py-0.5 mb-2">
                  FEATURED
                </span>
                <h3 className="font-semibold line-clamp-1">{b.name}</h3>
                <p className="text-xs text-muted">
                  {b.category.name} · {b.county.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Latest Deals</h2>
          <Link href="/deals" className="text-sm text-primary">
            Browse all
          </Link>
        </div>
        {deals.length === 0 ? (
          <p className="text-muted text-sm">
            No active deals yet. Check back soon, or{" "}
            <Link href="/business/register" className="text-primary">
              list your business
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Browse by County</h2>
        <div className="flex flex-wrap gap-2">
          {counties.slice(0, 12).map((c) => (
            <Link
              key={c.id}
              href={`/deals?county=${c.id}`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-primary"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/deals" className="rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium">
            View all 47 counties →
          </Link>
        </div>
      </section>
    </div>
  );
}
