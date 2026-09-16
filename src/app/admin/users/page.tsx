import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import UserRoleControls from "@/components/admin/UserRoleControls";

export default async function AdminUsersPage() {
  const admin = await getCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { businesses: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Users</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-surface p-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium">
                {u.name}{" "}
                {!u.isActive && (
                  <span className="text-xs text-danger font-semibold ml-1">DEACTIVATED</span>
                )}
              </p>
              <p className="text-xs text-muted">
                {u.email} · {u.phone ?? "no phone"} · {u.role}
                {u._count.businesses > 0 ? " · has business" : ""}
              </p>
              <p className="text-xs text-muted">Joined {formatDate(u.createdAt)}</p>
            </div>
            {u.id !== admin?.id && <UserRoleControls userId={u.id} role={u.role} isActive={u.isActive} />}
          </div>
        ))}
      </div>
    </div>
  );
}
