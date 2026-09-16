import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/(auth)/actions";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const business = await prisma.business.findFirst({ where: { ownerId: user.id } });

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">My Account</h1>
      <p className="text-sm text-muted">{user.email}</p>

      <div className="rounded-xl border border-border bg-surface p-4 flex flex-wrap gap-2">
        {business ? (
          <Link href="/business" className="rounded-lg bg-primary text-primary-contrast px-4 py-2 text-sm font-medium">
            My Business Dashboard
          </Link>
        ) : (
          <Link href="/business/register" className="rounded-lg bg-primary text-primary-contrast px-4 py-2 text-sm font-medium">
            Register a Business
          </Link>
        )}
        {user.role === "ADMIN" && (
          <Link href="/admin" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Admin Dashboard
          </Link>
        )}
        <Link href="/saved" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
          Saved Deals
        </Link>
      </div>

      <ProfileForm name={user.name} phone={user.phone} />
      <PasswordForm />

      <form action={logoutAction}>
        <button type="submit" className="w-full rounded-lg border border-danger/40 text-danger py-2.5 text-sm font-medium">
          Log out
        </button>
      </form>
    </div>
  );
}
