import Link from "next/link";
import type { User } from "@prisma/client";
import { logoutAction } from "@/app/(auth)/actions";

export default function SiteHeader({
  user,
  tagline,
  hasBusiness,
}: {
  user: User | null;
  tagline: string;
  hasBusiness: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="text-lg font-extrabold tracking-tight text-primary">
            Mtaani Deals
          </span>
          <span className="hidden sm:inline text-xs text-muted">{tagline}</span>
        </Link>

        <div className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/deals" className="hover:text-primary">
            Browse
          </Link>
          <Link href="/businesses" className="hover:text-primary">
            Businesses
          </Link>
          {user ? (
            <>
              <Link href="/saved" className="hover:text-primary">
                Saved
              </Link>
              {hasBusiness ? (
                <Link href="/business" className="hover:text-primary">
                  My Business
                </Link>
              ) : (
                <Link href="/business/register" className="hover:text-primary">
                  Register Business
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-primary">
                  Admin
                </Link>
              )}
              <Link href="/account" className="hover:text-primary">
                {user.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button className="text-muted hover:text-danger" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-1.5 text-primary-contrast font-medium hover:bg-primary-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <Link
          href="/deals"
          className="sm:hidden rounded-full bg-primary text-primary-contrast text-sm font-medium px-3 py-1.5"
        >
          Browse
        </Link>
      </div>
    </header>
  );
}
