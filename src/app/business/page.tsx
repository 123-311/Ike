import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/30",
  APPROVED: "bg-success/10 text-success border-success/30",
  REJECTED: "bg-danger/10 text-danger border-danger/30",
  SUSPENDED: "bg-muted/10 text-muted border-border",
};

export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business");
  const business = await getOwnedBusinessOrRedirect(user);

  const now = new Date();
  const [dealCounts, activeFeatured, activeBoosts, pendingPayments, sub] = await Promise.all([
    prisma.deal.groupBy({
      by: ["status"],
      where: { businessId: business.id },
      _count: true,
    }),
    prisma.featuredBusiness.findFirst({
      where: { businessId: business.id, status: "ACTIVE", endDate: { gt: now } },
      orderBy: { endDate: "desc" },
    }),
    prisma.dealBoost.findMany({
      where: { deal: { businessId: business.id }, status: "ACTIVE", endDate: { gt: now } },
      include: { deal: { select: { title: true } } },
    }),
    prisma.payment.count({ where: { businessId: business.id, status: "PENDING_VERIFICATION" } }),
    prisma.subscription.findFirst({
      where: { businessId: business.id, status: "ACTIVE", endDate: { gt: now } },
      orderBy: { endDate: "desc" },
    }),
  ]);

  const counts = Object.fromEntries(dealCounts.map((c) => [c.status, c._count]));
  const activeDeals =
    (counts.APPROVED ?? 0); // note: expired ones are swept to EXPIRED separately

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold">{business.name}</h1>
          <span
            className={`text-xs font-semibold rounded-full border px-2 py-0.5 ${STATUS_STYLES[business.verificationStatus]}`}
          >
            {business.verificationStatus.replace("_", " ")}
          </span>
        </div>
        {business.verificationStatus === "PENDING" && (
          <p className="text-sm text-muted mt-1">
            Your business is awaiting admin review. You can still add deals — they
            won&apos;t go public until both your business and the deal are approved.
          </p>
        )}
        {business.verificationStatus === "REJECTED" && (
          <p className="text-sm text-danger mt-1">
            Rejected: {business.rejectionReason ?? "No reason given."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active Deals" value={activeDeals} />
        <Stat label="Pending" value={counts.PENDING ?? 0} />
        <Stat label="Expired" value={counts.EXPIRED ?? 0} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-sm">
        <h2 className="font-semibold mb-1">Promotions</h2>
        <p>
          Business Premium:{" "}
          {sub ? (
            <span className="text-success font-medium">Active until {formatDate(sub.endDate!)}</span>
          ) : (
            <span className="text-muted">Not subscribed</span>
          )}
        </p>
        <p>
          Featured Business:{" "}
          {activeFeatured ? (
            <span className="text-success font-medium">Active until {formatDate(activeFeatured.endDate!)}</span>
          ) : (
            <span className="text-muted">Not featured</span>
          )}
        </p>
        <p>
          Deal Boosts:{" "}
          {activeBoosts.length > 0 ? (
            <span className="text-success font-medium">
              {activeBoosts.map((b) => b.deal.title).join(", ")}
            </span>
          ) : (
            <span className="text-muted">None active</span>
          )}
        </p>
        {pendingPayments > 0 && (
          <p className="text-warning">
            {pendingPayments} payment{pendingPayments === 1 ? "" : "s"} pending admin verification.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/business/deals/new" className="rounded-lg bg-primary text-primary-contrast text-center py-2.5 text-sm font-semibold">
          + Add Deal
        </Link>
        <Link href="/business/deals" className="rounded-lg border border-border text-center py-2.5 text-sm font-semibold">
          Manage Deals
        </Link>
        <Link href="/business/promote" className="rounded-lg border border-border text-center py-2.5 text-sm font-semibold">
          Promote Business
        </Link>
        <Link href="/business/payments" className="rounded-lg border border-border text-center py-2.5 text-sm font-semibold">
          Payment History
        </Link>
        <Link href="/business/edit" className="col-span-2 rounded-lg border border-border text-center py-2.5 text-sm font-semibold">
          Manage Business Profile
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
