import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatKes, formatDate } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import RejectForm from "@/components/admin/RejectForm";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/admin/actions";

const TABS = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "ALL"] as const;

const TYPE_LABELS: Record<string, string> = {
  BUSINESS_SUBSCRIPTION: "Business Subscription",
  FEATURED_BUSINESS: "Featured Business",
  DEAL_BOOST: "Deal Boost",
  SPONSORED_DEAL: "Sponsored Deal",
  ADVERTISING: "Advertising",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tab = (TABS as readonly string[]).includes(status ?? "") ? status! : "PENDING_VERIFICATION";

  const payments = await prisma.payment.findMany({
    where: tab === "ALL" ? {} : { status: tab as "PENDING_VERIFICATION" },
    orderBy: { submittedAt: "desc" },
    take: 200,
    include: {
      package: true,
      business: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Payments — Verification Queue</h1>
      <p className="text-sm text-muted mb-4">
        Only actions valid for the payment&apos;s current status are shown.
        A verified or rejected payment can never be actioned again from here.
      </p>

      <div className="flex gap-2 mb-4 text-sm flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/payments?status=${t}`}
            className={`px-3 py-1.5 rounded-full border ${
              tab === t ? "bg-primary text-primary-contrast border-primary" : "border-border"
            }`}
          >
            {t.replace("_", " ")}
          </Link>
        ))}
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">No payments in this state.</p>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold">
                    {TYPE_LABELS[p.package.type]} — {p.package.name}
                  </p>
                  <p className="text-xs text-muted">
                    {p.business.name} · {p.user.name} ({p.user.email})
                  </p>
                  <p className="text-sm mt-1 font-bold text-primary">{formatKes(Number(p.amount))}</p>
                  <p className="text-xs text-muted">Ref: {p.transactionCode}</p>
                  <p className="text-xs text-muted">
                    Sent to: {p.mpesaReceivingNumber} · Submitted {formatDate(p.submittedAt)}
                  </p>
                  {p.status !== "PENDING_VERIFICATION" && (
                    <p className="text-xs text-muted mt-1">
                      {p.status === "VERIFIED" ? "Verified" : "Rejected"} {formatDate(p.verifiedAt ?? p.submittedAt)}
                      {p.rejectionReason && ` — ${p.rejectionReason}`}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold rounded-full border border-border px-2 py-0.5 shrink-0">
                  {p.status.replace("_", " ")}
                </span>
              </div>

              {p.status === "PENDING_VERIFICATION" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    action={verifyPaymentAction.bind(null, p.id)}
                    variant="primary"
                    confirmText="Verify this payment? This activates the promotion immediately."
                  >
                    Verify
                  </ActionButton>
                  <RejectForm action={rejectPaymentAction.bind(null, p.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
