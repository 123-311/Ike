import { prisma } from "@/lib/db";
import { formatKes } from "@/lib/format";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const now = new Date();

  const [
    totalUsers,
    admins,
    totalBusinesses,
    pendingBusinesses,
    approvedBusinesses,
    totalDeals,
    pendingDeals,
    activeDeals,
    expiredDeals,
    pendingPayments,
    verifiedPayments,
    activeSubscriptions,
    expiredSubscriptions,
    activeFeatured,
    activeBoosts,
    activePlacements,
    revenueAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.business.count(),
    prisma.business.count({ where: { verificationStatus: "PENDING" } }),
    prisma.business.count({ where: { verificationStatus: "APPROVED" } }),
    prisma.deal.count(),
    prisma.deal.count({ where: { status: "PENDING" } }),
    prisma.deal.count({ where: { status: "APPROVED", expiryDate: { gt: now } } }),
    prisma.deal.count({ where: { status: "EXPIRED" } }),
    prisma.payment.count({ where: { status: "PENDING_VERIFICATION" } }),
    prisma.payment.count({ where: { status: "VERIFIED" } }),
    prisma.subscription.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.featuredBusiness.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
    prisma.dealBoost.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
    prisma.advertisingPlacement.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
    prisma.payment.aggregate({ where: { status: "VERIFIED" }, _sum: { amount: true } }),
  ]);

  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Admin Overview</h1>

      <h2 className="text-sm font-semibold text-muted mb-2">Users</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="Admins" value={admins} />
        <StatCard label="Customers" value={totalUsers - admins} />
      </div>

      <h2 className="text-sm font-semibold text-muted mb-2">Businesses</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Businesses" value={totalBusinesses} />
        <StatCard label="Pending Approval" value={pendingBusinesses} />
        <StatCard label="Approved" value={approvedBusinesses} />
      </div>

      <h2 className="text-sm font-semibold text-muted mb-2">Deals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Deals" value={totalDeals} />
        <StatCard label="Pending" value={pendingDeals} />
        <StatCard label="Active" value={activeDeals} />
        <StatCard label="Expired" value={expiredDeals} />
      </div>

      <h2 className="text-sm font-semibold text-muted mb-2">Payments & Subscriptions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending Payments" value={pendingPayments} />
        <StatCard label="Verified Payments" value={verifiedPayments} />
        <StatCard label="Active Subscriptions" value={activeSubscriptions} />
        <StatCard label="Expired Subscriptions" value={expiredSubscriptions} />
      </div>

      <h2 className="text-sm font-semibold text-muted mb-2">Promotions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Featured Businesses" value={activeFeatured} />
        <StatCard label="Boosted Deals" value={activeBoosts} />
        <StatCard label="Active Ad Placements" value={activePlacements} />
      </div>

      <h2 className="text-sm font-semibold text-muted mb-2">Revenue</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Verified Revenue" value={formatKes(totalRevenue)} />
      </div>
    </div>
  );
}
