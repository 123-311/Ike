import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import ActionButton from "@/components/admin/ActionButton";
import RejectForm from "@/components/admin/RejectForm";
import {
  approveBusinessAction,
  rejectBusinessAction,
  suspendBusinessAction,
  reinstateBusinessAction,
} from "@/app/admin/actions";

const TABS = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "ALL"] as const;

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tab = (TABS as readonly string[]).includes(status ?? "") ? status! : "PENDING";

  const businesses = await prisma.business.findMany({
    where: tab === "ALL" ? {} : { verificationStatus: tab as "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { category: true, county: true, owner: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Businesses</h1>

      <div className="flex gap-2 mb-4 text-sm">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/businesses?status=${t}`}
            className={`px-3 py-1.5 rounded-full border ${
              tab === t ? "bg-primary text-primary-contrast border-primary" : "border-border"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {businesses.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">No businesses in this state.</p>
      ) : (
        <div className="space-y-3">
          {businesses.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <Link href={`/businesses/${b.id}`} className="font-semibold hover:text-primary">
                    {b.name}
                  </Link>
                  {b.isDemo && (
                    <span className="ml-2 rounded bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5">
                      DEMO
                    </span>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    {b.category.name} · {b.county.name} · {b.location}
                  </p>
                  <p className="text-xs text-muted">
                    Owner: {b.owner.name} ({b.owner.email})
                  </p>
                  <p className="text-xs text-muted">
                    Phone: {b.phone} · Registered {formatDate(b.createdAt)}
                  </p>
                  {b.rejectionReason && (
                    <p className="text-xs text-danger mt-1">Rejected: {b.rejectionReason}</p>
                  )}
                </div>
                <span className="text-xs font-semibold rounded-full border border-border px-2 py-0.5 shrink-0">
                  {b.verificationStatus}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {b.verificationStatus === "PENDING" && (
                  <>
                    <ActionButton
                      action={approveBusinessAction.bind(null, b.id)}
                      variant="primary"
                    >
                      Approve
                    </ActionButton>
                    <RejectForm action={rejectBusinessAction.bind(null, b.id)} />
                  </>
                )}
                {b.verificationStatus === "APPROVED" && (
                  <ActionButton
                    action={suspendBusinessAction.bind(null, b.id)}
                    variant="danger"
                    confirmText="Suspend this business? It will no longer be publicly visible."
                  >
                    Suspend
                  </ActionButton>
                )}
                {(b.verificationStatus === "SUSPENDED" || b.verificationStatus === "REJECTED") && (
                  <ActionButton action={reinstateBusinessAction.bind(null, b.id)} variant="primary">
                    Approve / Reinstate
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
