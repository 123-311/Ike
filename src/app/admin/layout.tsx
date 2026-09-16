import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sweepExpired } from "@/lib/promotions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/counties", label: "Counties" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  // Server-side role check — never trust anything from the client.
  if (user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-xl font-bold mb-2">Not authorized</h1>
        <p className="text-sm text-muted">
          Your account does not have admin access.
        </p>
      </div>
    );
  }

  // Opportunistic sweep so admin views (status counts, tabs) never show a
  // deal/promotion as active past its expiry, even if the scheduled cron
  // hasn't run recently. Public-facing queries filter by date directly as
  // the authoritative guard regardless of this sweep's timing.
  await sweepExpired();

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 text-sm border-b border-border">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="shrink-0 px-3 py-2 rounded-t-lg hover:bg-border/40 whitespace-nowrap"
          >
            {n.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
