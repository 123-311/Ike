"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@prisma/client";

function Item({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[11px] font-medium ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      <span aria-hidden className="text-lg leading-none">
        {icon}
      </span>
      {label}
    </Link>
  );
}

export default function BottomNav({
  user,
  hasBusiness,
}: {
  user: User | null;
  hasBusiness: boolean;
}) {
  const pathname = usePathname();

  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "Account" : "Log in";
  const businessHref = hasBusiness ? "/business" : "/business/register";

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur flex">
      <Item href="/" label="Home" icon="🏠" active={pathname === "/"} />
      <Item
        href="/deals"
        label="Deals"
        icon="🏷️"
        active={pathname.startsWith("/deals")}
      />
      <Item
        href="/saved"
        label="Saved"
        icon="♡"
        active={pathname.startsWith("/saved")}
      />
      <Item
        href={businessHref}
        label="Business"
        icon="🏪"
        active={pathname.startsWith("/business")}
      />
      <Item
        href={accountHref}
        label={accountLabel}
        icon="👤"
        active={pathname.startsWith("/account") || pathname.startsWith("/login")}
      />
    </nav>
  );
}
