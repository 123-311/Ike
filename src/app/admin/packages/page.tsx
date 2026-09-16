import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/discount";
import PackageEditForm from "@/components/admin/PackageEditForm";
import CreatePackageForm from "@/components/admin/CreatePackageForm";

const TYPE_LABELS: Record<string, string> = {
  BUSINESS_SUBSCRIPTION: "Business Subscription",
  FEATURED_BUSINESS: "Featured Business",
  DEAL_BOOST: "Deal Boost",
  SPONSORED_DEAL: "Sponsored Deal",
  ADVERTISING: "Advertising",
};

export default async function AdminPackagesPage() {
  const packages = await prisma.promotionPackage.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  const byType = (t: string) => packages.filter((p) => p.type === t);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Promotion Packages</h1>
      <p className="text-sm text-muted mb-4">
        Prices, durations, and active status drive every promotion screen —
        changes here take effect immediately without a code deploy.
      </p>

      <CreatePackageForm />

      {Object.keys(TYPE_LABELS).map((type) => (
        <section key={type} className="mb-6">
          <h2 className="font-semibold mb-2">{TYPE_LABELS[type]}</h2>
          <div className="space-y-2">
            {byType(type).length === 0 ? (
              <p className="text-sm text-muted">No packages yet.</p>
            ) : (
              byType(type).map((p) => (
                <PackageEditForm
                  key={p.id}
                  pkg={{
                    id: p.id,
                    name: p.name,
                    durationDays: p.durationDays,
                    price: decimalToNumber(p.price),
                    active: p.active,
                  }}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
