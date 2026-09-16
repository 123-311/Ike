import Link from "next/link";
import { prisma } from "@/lib/db";
import { PUBLIC_BUSINESS_WHERE } from "@/lib/discount";
import type { Prisma } from "@prisma/client";

type SearchParams = { q?: string; category?: string; county?: string };

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const categoryId = sp.category ?? "";
  const countyId = sp.county ?? "";

  const where: Prisma.BusinessWhereInput = {
    ...PUBLIC_BUSINESS_WHERE,
    ...(categoryId ? { categoryId } : {}),
    ...(countyId ? { countyId } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const now = new Date();
  const [businesses, categories, counties] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: { name: "asc" },
      take: 60,
      include: {
        category: { select: { name: true } },
        county: { select: { name: true } },
        featuredPeriods: { where: { status: "ACTIVE", endDate: { gt: now } }, select: { id: true } },
        _count: { select: { deals: { where: { status: "APPROVED", expiryDate: { gt: now } } } } },
      },
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Businesses</h1>

      <form action="/businesses" method="GET" className="grid grid-cols-3 gap-2 mb-5 text-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search businesses..."
          className="col-span-3 rounded-lg border border-border bg-surface px-3 py-2"
        />
        <select name="category" defaultValue={categoryId} className="rounded-lg border border-border bg-surface px-2 py-2">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="county" defaultValue={countyId} className="rounded-lg border border-border bg-surface px-2 py-2">
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-primary text-primary-contrast font-medium">Filter</button>
      </form>

      {businesses.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">No businesses match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/businesses/${b.id}`}
              className="rounded-xl border border-border bg-surface p-4 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{b.name}</h3>
                {b.featuredPeriods.length > 0 && (
                  <span className="rounded-full bg-accent text-accent-contrast text-[10px] font-bold px-2 py-0.5">
                    FEATURED
                  </span>
                )}
                {b.isDemo && (
                  <span className="rounded bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-0.5">
                {b.category.name} · {b.county.name}
              </p>
              <p className="text-xs text-muted mt-1">{b._count.deals} active deal{b._count.deals === 1 ? "" : "s"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
