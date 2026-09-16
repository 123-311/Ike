import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { formatKes } from "@/lib/format";
import PaySubmitForm from "@/components/business/PaySubmitForm";

export default async function PromotePayPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string; dealId?: string }>;
}) {
  const { packageId, dealId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/promote");
  const business = await getOwnedBusinessOrRedirect(user);

  if (!packageId) notFound();
  const pkg = await prisma.promotionPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.active) notFound();

  let deal = null;
  if (dealId) {
    deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.businessId !== business.id) notFound();
  }

  const [mpesaNumber, instructions, receivingStatus, methodLabel] = await Promise.all([
    getSetting(SETTING_KEYS.MPESA_RECEIVING_NUMBER),
    getSetting(SETTING_KEYS.PAYMENT_INSTRUCTIONS),
    getSetting(SETTING_KEYS.PAYMENT_RECEIVING_STATUS),
    getSetting(SETTING_KEYS.PAYMENT_METHOD_LABEL),
  ]);

  const paymentsOpen = receivingStatus === "ENABLED" && Boolean(mpesaNumber);

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-1">Pay via {methodLabel}</h1>

      <div className="rounded-xl border border-border bg-surface p-4 my-4">
        <p className="text-sm text-muted">Selected package</p>
        <p className="font-semibold">{pkg.name}</p>
        {deal && <p className="text-sm text-muted">For deal: {deal.title}</p>}
        <p className="text-sm text-muted">{pkg.durationDays} day{pkg.durationDays === 1 ? "" : "s"}</p>
        <p className="text-2xl font-extrabold text-primary mt-1">{formatKes(Number(pkg.price))}</p>
      </div>

      {!paymentsOpen ? (
        <p className="rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
          Payments are not being accepted right now. Please contact the platform
          admin, or check back later.
        </p>
      ) : (
        <>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-4">
            <p className="text-sm text-muted">Send payment to</p>
            <p className="text-xl font-extrabold tracking-wide">{mpesaNumber}</p>
            <p className="text-sm mt-2 whitespace-pre-line">{instructions}</p>
          </div>

          <PaySubmitForm packageId={pkg.id} dealId={deal?.id} />
        </>
      )}
    </div>
  );
}
