import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicDealWhere } from "@/lib/discount";
import DealCard from "@/components/deals/DealCard";
import FilterBar from "@/components/deals/FilterBar";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 24;

type SearchParams = {
  q?: string;
  category?: string;
  county?: string;
  sort?: string;
  page?: string;
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const categoryId = sp.category ?? "";
  const countyId = sp.county ?? "";
  const sort = sp.sort ?? "latest";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.DealWhereInput = {
    ...publicDealWhere(),
    ...(categoryId ? { categoryId } : {}),
    ...(countyId ? { countyId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.DealOrderByWithRelationInput =
    sort === "discount"
      ? { discountPercent: "desc" }
      : sort === "expiring"
      ? { expiryDate: "asc" }
      : { createdAt: "desc" };

  const [total, deals, categories, counties, boosted] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        business: { select: { id: true, name: true, verificationStatus: true, isDemo: true } },
        category: { select: { name: true } },
        county: { select: { name: true } },
      },
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.dealBoost.findMany({ where: { status: "ACTIVE", endDate: { gt: new Date() } }, select: { dealId: true } }),
  ]);

  const boostedIds = new Set(boosted.map((b) => b.dealId));
  const items = deals.map((d) => ({ ...d, isBoosted: boostedIds.has(d.id) }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Partial<SearchParams>) {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(categoryId ? { category: categoryId } : {}),
      ...(countyId ? { county: countyId } : {}),
      ...(sort !== "latest" ? { sort } : {}),
      ...overrides,
    } as Record<string, string>);
    return `/deals?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Browse Deals</h1>

      <form action="/deals" method="GET" className="flex gap-2 mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search deals..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2"
        />
        {categoryId && <input type="hidden" name="category" value={categoryId} />}
        {countyId && <input type="hidden" name="county" value={countyId} />}
        <button className="rounded-lg bg-primary text-primary-contrast px-4 font-medium">
          Search
        </button>
      </form>

      <FilterBar
        q={q}
        categoryId={categoryId}
        countyId={countyId}
        sort={sort}
        categories={categories}
        counties={counties}
      />

      <p className="text-sm text-muted mb-3">
        {total} deal{total === 1 ? "" : "s"} found
      </p>

      {items.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">
          No deals match your search. Try a different keyword or filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-sm">
          {page > 1 && (
            <Link href={buildHref({ page: String(page - 1) })} className="px-3 py-1.5 rounded border border-border">
              Previous
            </Link>
          )}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildHref({ page: String(page + 1) })} className="px-3 py-1.5 rounded border border-border">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
