import Link from "next/link";
import { formatKes, daysUntil } from "@/lib/format";
import { decimalToNumber } from "@/lib/discount";
import type { Deal, Business, Category, County } from "@prisma/client";

export type DealCardData = Deal & {
  business: Pick<Business, "id" | "name" | "verificationStatus" | "isDemo">;
  category: Pick<Category, "name">;
  county: Pick<County, "name">;
  isBoosted?: boolean;
};

export default function DealCard({ deal }: { deal: DealCardData }) {
  const original = decimalToNumber(deal.originalPrice);
  const price = decimalToNumber(deal.dealPrice);
  const left = daysUntil(deal.expiryDate);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block rounded-xl border border-border bg-surface overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-border flex items-center justify-center text-muted text-sm">
        {deal.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.images[0]}
            alt={deal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{deal.category.name}</span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-accent text-accent-contrast text-xs font-bold px-2 py-1">
          -{deal.discountPercent}%
        </span>
        {deal.isBoosted && (
          <span className="absolute top-2 right-2 rounded-full bg-primary text-primary-contrast text-[10px] font-bold px-2 py-1">
            BOOSTED
          </span>
        )}
        {deal.isDemo && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5">
            DEMO
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-muted truncate">
          {deal.business.name}
          {deal.business.verificationStatus === "APPROVED" && (
            <span className="text-primary"> ✓</span>
          )}
        </p>
        <h3 className="font-semibold leading-snug line-clamp-2 min-h-10">
          {deal.title}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-primary">{formatKes(price)}</span>
          <span className="text-xs text-muted line-through">
            {formatKes(original)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>{deal.county.name}</span>
          <span>
            {left <= 0
              ? "Expires today"
              : left === 1
              ? "1 day left"
              : `${left} days left`}
          </span>
        </div>
      </div>
    </Link>
  );
}
