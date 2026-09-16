import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { publicDealWhere } from "@/lib/discount";
import { waLink, telLink } from "@/lib/format";
import DealCard from "@/components/deals/DealCard";
import ShareButton from "@/components/ShareButton";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      category: true,
      county: true,
      featuredPeriods: { where: { status: "ACTIVE", endDate: { gt: now } }, take: 1 },
      deals: {
        where: publicDealWhere(),
        orderBy: { createdAt: "desc" },
        include: {
          business: { select: { id: true, name: true, verificationStatus: true, isDemo: true } },
          category: { select: { name: true } },
          county: { select: { name: true } },
        },
      },
    },
  });

  const user = await getCurrentUser();
  const isOwner = user && business && business.ownerId === user.id;
  const isAdmin = user?.role === "ADMIN";

  if (!business || (business.verificationStatus !== "APPROVED" && !isOwner && !isAdmin)) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      {business.verificationStatus !== "APPROVED" && (isOwner || isAdmin) && (
        <p className="mb-4 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-sm text-warning">
          This business is not publicly visible yet (status: {business.verificationStatus}
          {business.rejectionReason ? ` — ${business.rejectionReason}` : ""}).
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">{business.name}</h1>
        {business.verificationStatus === "APPROVED" && (
          <span className="text-primary text-sm font-medium">✓ Verified</span>
        )}
        {business.featuredPeriods.length > 0 && (
          <span className="rounded-full bg-accent text-accent-contrast text-xs font-bold px-2 py-0.5">
            FEATURED
          </span>
        )}
        {business.isDemo && (
          <span className="rounded bg-black/70 text-white text-xs font-medium px-2 py-0.5">
            DEMO — for evaluation only
          </span>
        )}
      </div>

      <p className="text-sm text-muted mt-1">
        {business.category.name} · {business.county.name} · {business.location}
      </p>

      <p className="mt-4 whitespace-pre-line">{business.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={telLink(business.phone)} className="rounded-lg bg-primary text-primary-contrast px-4 py-2.5 text-sm font-semibold">
          📞 Call
        </a>
        {business.whatsapp && (
          <a
            href={waLink(business.whatsapp, `Hi ${business.name}, I found you on Mtaani Deals.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-success text-primary-contrast px-4 py-2.5 text-sm font-semibold"
          >
            💬 WhatsApp
          </a>
        )}
        <ShareButton title={business.name} text={`Check out ${business.name} on Mtaani Deals`} />
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold">Active Deals</h2>
      {business.deals.length === 0 ? (
        <p className="text-sm text-muted">No active deals from this business right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {business.deals.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}

      {(isOwner || isAdmin) && (
        <p className="mt-6 text-sm">
          <Link href="/business" className="text-primary font-medium">
            Manage this business →
          </Link>
        </p>
      )}
    </div>
  );
}
