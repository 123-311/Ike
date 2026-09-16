import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import { formatKes } from "@/lib/format";

function PackageCard({
  name,
  durationDays,
  price,
  href,
  description,
}: {
  name: string;
  durationDays: number;
  price: number;
  href: string;
  description?: string | null;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-surface p-4 hover:border-primary"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted">{durationDays} day{durationDays === 1 ? "" : "s"}</p>
          {description && <p className="text-xs text-muted mt-1">{description}</p>}
        </div>
        <p className="font-bold text-primary">{formatKes(price)}</p>
      </div>
    </Link>
  );
}

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>;
}) {
  const { dealId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/promote");
  const business = await getOwnedBusinessOrRedirect(user);

  const packages = await prisma.promotionPackage.findMany({
    where: { active: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  const byType = (t: string) => packages.filter((p) => p.type === t);

  const approvedDeals = await prisma.deal.findMany({
    where: { businessId: business.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
  const selectedDeal = dealId ? approvedDeals.find((d) => d.id === dealId) : undefined;

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-1">Promote Your Business</h1>
        <p className="text-sm text-muted">
          All prices and durations are set by Mtaani Deals and can change. Nothing
          activates until an admin verifies your M-PESA payment.
        </p>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Business Premium</h2>
        <div className="space-y-2">
          {byType("BUSINESS_SUBSCRIPTION").map((p) => (
            <PackageCard
              key={p.id}
              name={p.name}
              durationDays={p.durationDays}
              price={Number(p.price)}
              description={p.description}
              href={`/business/promote/pay?packageId=${p.id}`}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Featured Business</h2>
        <p className="text-xs text-muted mb-2">
          Featured businesses appear at the top of the homepage and business listings.
        </p>
        <div className="space-y-2">
          {byType("FEATURED_BUSINESS").map((p) => (
            <PackageCard
              key={p.id}
              name={p.name}
              durationDays={p.durationDays}
              price={Number(p.price)}
              href={`/business/promote/pay?packageId=${p.id}`}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Deal Boost</h2>
        {approvedDeals.length === 0 ? (
          <p className="text-sm text-muted">
            You need at least one approved deal before you can boost it.
          </p>
        ) : !selectedDeal ? (
          <div>
            <p className="text-sm text-muted mb-2">Choose a deal to boost:</p>
            <div className="space-y-2">
              {approvedDeals.map((d) => (
                <Link
                  key={d.id}
                  href={`/business/promote?dealId=${d.id}`}
                  className="block rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:border-primary"
                >
                  {d.title}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-2">
              Boosting: <strong>{selectedDeal.title}</strong>{" "}
              <Link href="/business/promote" className="text-primary text-xs">
                (change)
              </Link>
            </p>
            <div className="space-y-2">
              {byType("DEAL_BOOST").map((p) => (
                <PackageCard
                  key={p.id}
                  name={p.name}
                  durationDays={p.durationDays}
                  price={Number(p.price)}
                  href={`/business/promote/pay?packageId=${p.id}&dealId=${selectedDeal.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Sponsored Deals</h2>
        {byType("SPONSORED_DEAL").length === 0 ? (
          <p className="text-sm text-muted">Coming soon.</p>
        ) : (
          <div className="space-y-2">
            {byType("SPONSORED_DEAL").map((p) => (
              <PackageCard
                key={p.id}
                name={p.name}
                durationDays={p.durationDays}
                price={Number(p.price)}
                href={`/business/promote/pay?packageId=${p.id}${selectedDeal ? `&dealId=${selectedDeal.id}` : ""}`}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Advertising</h2>
        {byType("ADVERTISING").length === 0 ? (
          <p className="text-sm text-muted">Coming soon.</p>
        ) : (
          <div className="space-y-2">
            {byType("ADVERTISING").map((p) => (
              <PackageCard
                key={p.id}
                name={p.name}
                durationDays={p.durationDays}
                price={Number(p.price)}
                href={`/business/promote/pay?packageId=${p.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
