import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/discount";
import { formatKes } from "@/lib/format";
import Link from "next/link";
import UnsaveButton from "@/components/deals/UnsaveButton";

export default async function SavedDealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/saved");

  const saved = await prisma.savedDeal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      deal: {
        include: {
          business: { select: { id: true, name: true, verificationStatus: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Saved Deals</h1>
      {saved.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">
          You haven&apos;t saved any deals yet.{" "}
          <Link href="/deals" className="text-primary">
            Browse deals
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {saved.map((s) => {
            const isAvailable =
              s.deal.status === "APPROVED" &&
              s.deal.expiryDate.getTime() > Date.now() &&
              s.deal.business.verificationStatus === "APPROVED";
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <Link
                  href={`/deals/${s.deal.id}`}
                  className={`flex-1 min-w-0 ${isAvailable ? "" : "opacity-60"}`}
                >
                  <p className="text-xs text-muted truncate">{s.deal.business.name}</p>
                  <h3 className="font-semibold truncate">{s.deal.title}</h3>
                  <p className="text-sm">
                    <span className="font-bold text-primary">
                      {formatKes(decimalToNumber(s.deal.dealPrice))}
                    </span>{" "}
                    <span className="text-muted line-through">
                      {formatKes(decimalToNumber(s.deal.originalPrice))}
                    </span>
                  </p>
                  {!isAvailable && (
                    <p className="text-xs text-warning mt-1">No longer available</p>
                  )}
                </Link>
                <UnsaveButton dealId={s.deal.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
