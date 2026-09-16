import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminAuditLogPage() {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Audit Log</h1>
      <div className="space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold">{l.action}</span>
              <span className="text-xs text-muted">{formatDate(l.createdAt)}</span>
            </div>
            <p className="text-xs text-muted">
              {l.admin.name} ({l.admin.email}) · {l.entityType} #{l.entityId}
            </p>
            {l.details !== null && (
              <pre className="mt-1 text-xs bg-background rounded p-2 overflow-x-auto">
                {JSON.stringify(l.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="text-sm text-muted py-8 text-center">No admin actions logged yet.</p>}
      </div>
    </div>
  );
}
