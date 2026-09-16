"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { paymentSubmitSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rateLimit";

export type PayFormState = { error?: string } | undefined;

async function getOwnedBusinessOrThrow(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new Error("You do not have a registered business.");
  return business;
}

export async function submitPaymentAction(
  _prev: PayFormState,
  formData: FormData
): Promise<PayFormState> {
  const user = await requireUser();
  const business = await getOwnedBusinessOrThrow(user.id);

  const rl = checkRateLimit(`submit-payment:${user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Too many payment submissions. Please try again later." };
  }

  const receivingStatus = await getSetting(SETTING_KEYS.PAYMENT_RECEIVING_STATUS);
  const mpesaNumber = await getSetting(SETTING_KEYS.MPESA_RECEIVING_NUMBER);
  if (receivingStatus !== "ENABLED" || !mpesaNumber) {
    return {
      error:
        "Payments are not being accepted right now. Please contact the platform admin.",
    };
  }

  const parsed = paymentSubmitSchema.safeParse({
    packageId: formData.get("packageId"),
    transactionCode: formData.get("transactionCode"),
    dealId: formData.get("dealId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }
  const { packageId, transactionCode, dealId } = parsed.data;

  const pkg = await prisma.promotionPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.active) {
    return { error: "That package is no longer available." };
  }

  const duplicateCode = await prisma.payment.findUnique({ where: { transactionCode } });
  if (duplicateCode) {
    return {
      error:
        "This M-PESA transaction code has already been submitted. Each transaction code can only be used once.",
    };
  }

  let deal = null;
  if (pkg.type === "DEAL_BOOST" || pkg.type === "SPONSORED_DEAL") {
    if (!dealId) return { error: "Select a deal to promote." };
    deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.businessId !== business.id) {
      return { error: "Deal not found." };
    }
    if (deal.status !== "APPROVED") {
      return { error: "Only approved deals can be boosted or sponsored." };
    }
  }

  // Block a second pending submission for the same promotion target so a
  // business can't stack duplicate pending payments.
  const pendingWhere =
    pkg.type === "DEAL_BOOST"
      ? { dealBoost: { dealId: deal!.id, status: "PENDING_VERIFICATION" as const } }
      : pkg.type === "SPONSORED_DEAL"
      ? { sponsoredDeal: { dealId: deal!.id, status: "PENDING_VERIFICATION" as const } }
      : pkg.type === "FEATURED_BUSINESS"
      ? { featuredPeriod: { businessId: business.id, status: "PENDING_VERIFICATION" as const } }
      : pkg.type === "BUSINESS_SUBSCRIPTION"
      ? { subscription: { businessId: business.id, status: "PENDING_VERIFICATION" as const } }
      : null;

  if (pendingWhere) {
    const existingPending = await prisma.payment.findFirst({ where: pendingWhere });
    if (existingPending) {
      return {
        error:
          "You already have a pending payment for this promotion awaiting admin verification.",
      };
    }
  }

  const payment = await prisma.payment.create({
    data: {
      businessId: business.id,
      userId: user.id,
      packageId: pkg.id,
      amount: pkg.price,
      mpesaReceivingNumber: mpesaNumber,
      transactionCode,
      status: "PENDING_VERIFICATION",
    },
  });

  switch (pkg.type) {
    case "BUSINESS_SUBSCRIPTION":
      await prisma.subscription.create({
        data: { businessId: business.id, packageId: pkg.id, paymentId: payment.id },
      });
      break;
    case "FEATURED_BUSINESS":
      await prisma.featuredBusiness.create({
        data: { businessId: business.id, packageId: pkg.id, paymentId: payment.id },
      });
      break;
    case "DEAL_BOOST":
      await prisma.dealBoost.create({
        data: { dealId: deal!.id, packageId: pkg.id, paymentId: payment.id },
      });
      break;
    case "SPONSORED_DEAL":
      await prisma.sponsoredDeal.create({
        data: {
          businessId: business.id,
          dealId: deal!.id,
          packageId: pkg.id,
          paymentId: payment.id,
        },
      });
      break;
    case "ADVERTISING":
      return { error: "Advertising submission requires creative upload — not yet available." };
  }

  redirect("/business/payments?submitted=1");
}
