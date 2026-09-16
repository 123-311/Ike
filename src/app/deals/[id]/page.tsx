import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { decimalToNumber } from "@/lib/discount";
import { formatKes, formatDate, daysUntil, waLink, telLink } from "@/lib/format";
import { isDealSavedByCurrentUser } from "../actions";
import SaveButton from "@/components/deals/SaveButton";
import ShareButton from "@/components/ShareButton";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      business: { include: { category: true, county: true } },
      category: true,
      county: true,
    },
  });

  const user = await getCurrentUser();
  const isOwner = user && deal && deal.business.ownerId === user.id;
  const isAdmin = user?.role === "ADMIN";

  // Public visibility rule: only approved deals from approved businesses,
  // not expired. Owners and admins may still preview their own non-public
  // deal so they can see what was rejected/pending.
  const isPublic =
    deal &&
    deal.status === "APPROVED" &&
    deal.expiryDate > new Date() &&
    deal.business.verificationStatus === "APPROVED";

  if (!deal || (!isPublic && !isOwner && !isAdmin)) {
    notFound();
  }

  const original = decimalToNumber(deal.originalPrice);
  const price = decimalToNumber(deal.dealPrice);
  const left = daysUntil(deal.expiryDate);
  const saved = await isDealSavedByCurrentUser(deal.id);

  return (
    <div className="max-w-2xl mx-auto">
      {!isPublic && (isOwner || isAdmin) && (
        <p className="mb-4 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-sm text-warning">
          This deal is not publicly visible right now (status: {deal.status}
          {deal.business.verificationStatus !== "APPROVED"
            ? `, business: ${deal.business.verificationStatus}`
            : ""}
          ). Only you and admins can see this preview.
        </p>
      )}

      <div className="aspect-video rounded-xl bg-border flex items-center justify-center text-muted overflow-hidden">
        {deal.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.images[0]} alt={deal.title} className="w-full h-full object-cover" />
        ) : (
          <span>{deal.category.name}</span>
        )}
      </div>

      <div className="mt-4">
        {deal.isDemo && (
          <span className="inline-block mb-2 rounded bg-black/70 text-white text-xs font-medium px-2 py-1">
            DEMO — for evaluation only, not a real business
          </span>
        )}
        <Link href={`/businesses/${deal.business.id}`} className="text-sm text-primary font-medium">
          {deal.business.name}
          {deal.business.verificationStatus === "APPROVED" && " ✓ Verified"}
        </Link>
        <h1 className="text-2xl font-bold mt-1">{deal.title}</h1>

        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-extrabold text-primary">{formatKes(price)}</span>
          <span className="text-muted line-through">{formatKes(original)}</span>
          <span className="rounded-full bg-accent text-accent-contrast text-xs font-bold px-2 py-1">
            Save {formatKes(original - price)} ({deal.discountPercent}%)
          </span>
        </div>

        <p className="mt-2 text-sm text-muted">
          {deal.county.name} · {deal.location} · Expires {formatDate(deal.expiryDate)} (
          {left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : "expires today"})
        </p>

        <p className="mt-4 whitespace-pre-line">{deal.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={telLink(deal.business.phone)}
            className="rounded-lg bg-primary text-primary-contrast px-4 py-2.5 text-sm font-semibold"
          >
            📞 Call
          </a>
          {deal.business.whatsapp && (
            <a
              href={waLink(
                deal.business.whatsapp,
                `Hi, I'm interested in "${deal.title}" on Mtaani Deals.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-success text-primary-contrast px-4 py-2.5 text-sm font-semibold"
            >
              💬 WhatsApp
            </a>
          )}
          <SaveButton dealId={deal.id} initiallySaved={saved} isLoggedIn={Boolean(user)} />
          <ShareButton title={deal.title} text={`${deal.title} — ${formatKes(price)} at ${deal.business.name}`} />
        </div>
      </div>
    </div>
  );
}
