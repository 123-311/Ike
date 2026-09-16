import Link from "next/link";
import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/discount";
import { formatKes, formatDate } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import RejectForm from "@/components/admin/RejectForm";
import { approveDealAction, rejectDealAction, suspendDealAction } from "@/app/admin/actions";

const TABS = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "EXPIRED", "ALL"] as const;

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tab = (TABS as readonly string[]).includes(status ?? "") ? status! : "PENDING";

  const deals = await prisma.deal.findMany({
    where: tab === "ALL" ? {} : { status: tab as "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { business: { select: { name: true, verificationStatus: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Deals</h1>

      <div className="flex gap-2 mb-4 text-sm flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/deals?status=${t}`}
            className={`px-3 py-1.5 rounded-full border ${
              tab === t ? "bg-primary text-primary-contrast border-primary" : "border-border"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">No deals in this state.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <Link href={`/deals/${d.id}`} className="font-semibold hover:text-primary">
                    {d.title}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {d.business.name}
                    {d.business.verificationStatus !== "APPROVED" && (
                      <span className="text-warning"> (business {d.business.verificationStatus})</span>
                    )}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-bold text-primary">{formatKes(decimalToNumber(d.dealPrice))}</span>{" "}
                    <span className="text-muted line-through">{formatKes(decimalToNumber(d.originalPrice))}</span>{" "}
                    <span className="text-xs text-muted">(-{d.discountPercent}%)</span>
                  </p>
                  <p className="text-xs text-muted">Expires {formatDate(d.expiryDate)}</p>
                  {d.rejectionReason && (
                    <p className="text-xs text-danger mt-1">Rejected: {d.rejectionReason}</p>
                  )}
                </div>
                <span className="text-xs font-semibold rounded-full border border-border px-2 py-0.5 shrink-0">
                  {d.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {d.status === "PENDING" && (
                  <>
                    <ActionButton action={approveDealAction.bind(null, d.id)} variant="primary">
                      Approve
                    </ActionButton>
                    <RejectForm action={rejectDealAction.bind(null, d.id)} />
                  </>
                )}
                {d.status === "APPROVED" && (
                  <ActionButton
                    action={suspendDealAction.bind(null, d.id)}
                    variant="danger"
                    confirmText="Suspend this deal? It will no longer be publicly visible."
                  >
                    Suspend
                  </ActionButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
