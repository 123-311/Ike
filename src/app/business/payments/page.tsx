import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import { formatKes, formatDate } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  PENDING_VERIFICATION: "bg-warning/10 text-warning border-warning/30",
  VERIFIED: "bg-success/10 text-success border-success/30",
  REJECTED: "bg-danger/10 text-danger border-danger/30",
};

export default async function BusinessPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/payments");
  const business = await getOwnedBusinessOrRedirect(user);

  const payments = await prisma.payment.findMany({
    where: { businessId: business.id },
    orderBy: { submittedAt: "desc" },
    include: { package: true },
  });

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Payment History</h1>

      {submitted && (
        <p className="mb-4 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success">
          Your payment has been submitted for verification. Your promotion will
          activate after an admin verifies the transaction.
        </p>
      )}

      {payments.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">No payments yet.</p>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.package.name}</p>
                  <p className="text-sm text-muted">
                    {formatKes(Number(p.amount))} · {formatDate(p.submittedAt)}
                  </p>
                  <p className="text-xs text-muted mt-1">Ref: {p.transactionCode}</p>
                  {p.status === "REJECTED" && p.rejectionReason && (
                    <p className="text-xs text-danger mt-1">Reason: {p.rejectionReason}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold rounded-full border px-2 py-0.5 shrink-0 ${STATUS_STYLES[p.status]}`}>
                  {p.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
