import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// Every important admin action must be recorded here (approvals,
// rejections, payment verification, settings changes) — spec section 4/25.
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
    },
  });
}
