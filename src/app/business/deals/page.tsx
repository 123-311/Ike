import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/discount";
import { formatKes, formatDate } from "@/lib/format";
import WithdrawButton from "@/components/business/WithdrawButton";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/30",
  APPROVED: "bg-success/10 text-success border-success/30",
  REJECTED: "bg-danger/10 text-danger border-danger/30",
  EXPIRED: "bg-muted/10 text-muted border-border",
  SUSPENDED: "bg-muted/10 text-muted border-border",
};

export default async function BusinessDealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/deals");
  const business = await getOwnedBusinessOrRedirect(user);

  const deals = await prisma.deal.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Deals</h1>
        <Link href="/business/deals/new" className="rounded-lg bg-primary text-primary-contrast px-3 py-2 text-sm font-semibold">
          + Add Deal
        </Link>
      </div>

      {deals.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">You haven&apos;t added any deals yet.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{d.title}</h3>
                  <p className="text-sm">
                    <span className="font-bold text-primary">{formatKes(decimalToNumber(d.dealPrice))}</span>{" "}
                    <span className="text-muted line-through">{formatKes(decimalToNumber(d.originalPrice))}</span>{" "}
                    <span className="text-xs text-muted">(-{d.discountPercent}%)</span>
                  </p>
                  <p className="text-xs text-muted mt-1">Expires {formatDate(d.expiryDate)}</p>
                  {d.status === "REJECTED" && d.rejectionReason && (
                    <p className="text-xs text-danger mt-1">Reason: {d.rejectionReason}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold rounded-full border px-2 py-0.5 shrink-0 ${STATUS_STYLES[d.status]}`}>
                  {d.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/business/deals/${d.id}/edit`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
                  Edit
                </Link>
                <Link href={`/business/promote?dealId=${d.id}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
                  Boost
                </Link>
                {d.status !== "SUSPENDED" && (
                  <WithdrawButton dealId={d.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
