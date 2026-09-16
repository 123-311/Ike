"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { rejectionSchema } from "@/lib/validation/schemas";
import { addDays } from "@/lib/discount";

export type AdminFormState = { error?: string; success?: string } | undefined;

export async function approveBusinessAction(businessId: string) {
  const admin = await requireAdmin();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error("Business not found.");
  if (business.ownerId === admin.id) {
    throw new Error("You cannot approve your own business. Ask another admin.");
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      verificationStatus: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "APPROVE_BUSINESS",
    entityType: "Business",
    entityId: businessId,
  });

  revalidatePath("/admin/businesses");
}

export async function rejectBusinessAction(
  businessId: string,
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { error: "Business not found." };
  if (business.ownerId === admin.id) {
    return { error: "You cannot reject your own business. Ask another admin." };
  }

  const parsed = rejectionSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Provide a reason." };

  await prisma.business.update({
    where: { id: businessId },
    data: {
      verificationStatus: "REJECTED",
      rejectionReason: parsed.data.reason,
      approvedById: null,
      approvedAt: null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "REJECT_BUSINESS",
    entityType: "Business",
    entityId: businessId,
    details: { reason: parsed.data.reason },
  });

  revalidatePath("/admin/businesses");
  return { success: "Business rejected." };
}

export async function suspendBusinessAction(businessId: string) {
  const admin = await requireAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { verificationStatus: "SUSPENDED" },
  });
  await logAdminAction({
    adminId: admin.id,
    action: "SUSPEND_BUSINESS",
    entityType: "Business",
    entityId: businessId,
  });
  revalidatePath("/admin/businesses");
}

export async function reinstateBusinessAction(businessId: string) {
  const admin = await requireAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { verificationStatus: "APPROVED", approvedById: admin.id, approvedAt: new Date() },
  });
  await logAdminAction({
    adminId: admin.id,
    action: "REINSTATE_BUSINESS",
    entityType: "Business",
    entityId: businessId,
  });
  revalidatePath("/admin/businesses");
}

export async function approveDealAction(dealId: string) {
  const admin = await requireAdmin();
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { business: true } });
  if (!deal) throw new Error("Deal not found.");
  if (deal.business.ownerId === admin.id) {
    throw new Error("You cannot approve your own deal. Ask another admin.");
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "APPROVE_DEAL",
    entityType: "Deal",
    entityId: dealId,
  });

  revalidatePath("/admin/deals");
}

export async function rejectDealAction(
  dealId: string,
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { business: true } });
  if (!deal) return { error: "Deal not found." };
  if (deal.business.ownerId === admin.id) {
    return { error: "You cannot reject your own deal. Ask another admin." };
  }

  const parsed = rejectionSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Provide a reason." };

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.reason,
      approvedById: null,
      approvedAt: null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "REJECT_DEAL",
    entityType: "Deal",
    entityId: dealId,
    details: { reason: parsed.data.reason },
  });

  revalidatePath("/admin/deals");
  return { success: "Deal rejected." };
}

export async function suspendDealAction(dealId: string) {
  const admin = await requireAdmin();
  await prisma.deal.update({ where: { id: dealId }, data: { status: "SUSPENDED" } });
  await logAdminAction({
    adminId: admin.id,
    action: "SUSPEND_DEAL",
    entityType: "Deal",
    entityId: dealId,
  });
  revalidatePath("/admin/deals");
}

// Verifying a payment is the ONLY thing that ever activates a paid
// promotion. Submitting a transaction code never does this on its own —
// see spec section 15/20/21/42. State-aware: only callable while the
// payment is still PENDING_VERIFICATION (enforced below), so a payment
// can never be "verified" twice or reversed by re-clicking a stale button.
export async function verifyPaymentAction(paymentId: string) {
  const admin = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { package: true },
  });
  if (!payment) throw new Error("Payment not found.");
  if (payment.userId === admin.id) {
    throw new Error("You cannot verify your own payment. Ask another admin.");
  }
  if (payment.status !== "PENDING_VERIFICATION") {
    throw new Error("This payment has already been reviewed.");
  }

  const now = new Date();
  const startDate = now;
  const endDate = addDays(now, payment.package.durationDays);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "VERIFIED", verifiedAt: now, verifiedById: admin.id },
    });

    switch (payment.package.type) {
      case "BUSINESS_SUBSCRIPTION":
        await tx.subscription.update({
          where: { paymentId },
          data: { status: "ACTIVE", startDate, endDate, verifiedAt: now, verifiedById: admin.id },
        });
        break;
      case "FEATURED_BUSINESS":
        await tx.featuredBusiness.update({
          where: { paymentId },
          data: { status: "ACTIVE", startDate, endDate },
        });
        break;
      case "DEAL_BOOST":
        await tx.dealBoost.update({
          where: { paymentId },
          data: { status: "ACTIVE", startDate, endDate },
        });
        break;
      case "SPONSORED_DEAL":
        await tx.sponsoredDeal.update({
          where: { paymentId },
          data: { status: "ACTIVE", startDate, endDate },
        });
        break;
      case "ADVERTISING":
        await tx.advertisingPlacement.update({
          where: { paymentId },
          data: { status: "ACTIVE", startDate, endDate },
        });
        break;
    }
  });

  await logAdminAction({
    adminId: admin.id,
    action: "VERIFY_PAYMENT",
    entityType: "Payment",
    entityId: paymentId,
    details: { amount: payment.amount.toString(), packageType: payment.package.type, endDate },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/business");
  revalidatePath("/business/payments");
}

export async function rejectPaymentAction(
  paymentId: string,
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const admin = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { package: true },
  });
  if (!payment) return { error: "Payment not found." };
  if (payment.userId === admin.id) {
    return { error: "You cannot reject your own payment. Ask another admin." };
  }
  if (payment.status !== "PENDING_VERIFICATION") {
    return { error: "This payment has already been reviewed." };
  }

  const parsed = rejectionSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Provide a reason." };

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.reason,
        verifiedAt: new Date(),
        verifiedById: admin.id,
      },
    });

    switch (payment.package.type) {
      case "BUSINESS_SUBSCRIPTION":
        await tx.subscription.update({
          where: { paymentId },
          data: { status: "REJECTED", rejectionReason: parsed.data.reason },
        });
        break;
      case "FEATURED_BUSINESS":
        await tx.featuredBusiness.update({ where: { paymentId }, data: { status: "REJECTED" } });
        break;
      case "DEAL_BOOST":
        await tx.dealBoost.update({ where: { paymentId }, data: { status: "REJECTED" } });
        break;
      case "SPONSORED_DEAL":
        await tx.sponsoredDeal.update({ where: { paymentId }, data: { status: "REJECTED" } });
        break;
      case "ADVERTISING":
        await tx.advertisingPlacement.update({ where: { paymentId }, data: { status: "REJECTED" } });
        break;
    }
  });

  await logAdminAction({
    adminId: admin.id,
    action: "REJECT_PAYMENT",
    entityType: "Payment",
    entityId: paymentId,
    details: { reason: parsed.data.reason },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/business/payments");
  return { success: "Payment rejected." };
}

export async function setUserActiveAction(userId: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You cannot deactivate your own account.");

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await logAdminAction({
    adminId: admin.id,
    action: isActive ? "REACTIVATE_USER" : "DEACTIVATE_USER",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/admin/users");
}

export async function setUserRoleAction(userId: string, role: "ADMIN" | "CUSTOMER") {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You cannot change your own role.");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAdminAction({
    adminId: admin.id,
    action: "SET_USER_ROLE",
    entityType: "User",
    entityId: userId,
    details: { role },
  });
  revalidatePath("/admin/users");
}
