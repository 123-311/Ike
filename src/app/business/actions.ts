"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettingNumber } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { calcDiscount } from "@/lib/discount";
import {
  businessRegistrationSchema,
  dealCreateSchema,
} from "@/lib/validation/schemas";

export type FormState = { error?: string; success?: string } | undefined;

export async function registerBusinessAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const existing = await prisma.business.findFirst({ where: { ownerId: user.id } });
  if (existing) {
    return { error: "You already have a registered business." };
  }

  const parsed = businessRegistrationSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    countyId: formData.get("countyId"),
    location: formData.get("location"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || "",
    description: formData.get("description"),
    logoUrl: formData.get("logoUrl") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const data = parsed.data;
  await prisma.business.create({
    data: {
      ownerId: user.id,
      name: data.name,
      categoryId: data.categoryId,
      countyId: data.countyId,
      location: data.location,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      description: data.description,
      logoUrl: data.logoUrl || null,
      verificationStatus: "PENDING",
    },
  });

  redirect("/business");
}

async function getOwnedBusinessOrThrow(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new Error("You do not have a registered business.");
  return business;
}

export async function createDealAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const business = await getOwnedBusinessOrThrow(user.id);

  const maxDeals = await getSettingNumber(SETTING_KEYS.MAX_ACTIVE_DEALS_PER_BUSINESS, 5);
  const activeCount = await prisma.deal.count({
    where: {
      businessId: business.id,
      status: { in: ["PENDING", "APPROVED"] },
      expiryDate: { gt: new Date() },
    },
  });
  if (activeCount >= maxDeals) {
    return {
      error: `You have reached the maximum of ${maxDeals} active deals allowed. Wait for one to expire or contact support to increase your limit.`,
    };
  }

  const parsed = dealCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    originalPrice: formData.get("originalPrice"),
    dealPrice: formData.get("dealPrice"),
    categoryId: formData.get("categoryId"),
    countyId: formData.get("countyId"),
    location: formData.get("location"),
    expiryDate: formData.get("expiryDate"),
    imageUrl: formData.get("imageUrl") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const data = parsed.data;
  const { discountPercent, savings } = calcDiscount(data.originalPrice, data.dealPrice);

  const deal = await prisma.deal.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      originalPrice: data.originalPrice,
      dealPrice: data.dealPrice,
      discountPercent,
      savings,
      categoryId: data.categoryId,
      countyId: data.countyId,
      location: data.location,
      expiryDate: data.expiryDate,
      images: data.imageUrl ? [data.imageUrl] : [],
      status: "PENDING",
    },
  });

  revalidatePath("/business/deals");
  redirect(`/business/deals/${deal.id}/edit?created=1`);
}

export async function updateDealAction(
  dealId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const business = await getOwnedBusinessOrThrow(user.id);

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.businessId !== business.id) {
    return { error: "Deal not found." };
  }

  const parsed = dealCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    originalPrice: formData.get("originalPrice"),
    dealPrice: formData.get("dealPrice"),
    categoryId: formData.get("categoryId"),
    countyId: formData.get("countyId"),
    location: formData.get("location"),
    expiryDate: formData.get("expiryDate"),
    imageUrl: formData.get("imageUrl") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const data = parsed.data;
  const { discountPercent, savings } = calcDiscount(data.originalPrice, data.dealPrice);

  // Editing content invalidates any prior approval/rejection — it must be
  // re-reviewed before it can go public again.
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      title: data.title,
      description: data.description,
      originalPrice: data.originalPrice,
      dealPrice: data.dealPrice,
      discountPercent,
      savings,
      categoryId: data.categoryId,
      countyId: data.countyId,
      location: data.location,
      expiryDate: data.expiryDate,
      images: data.imageUrl ? [data.imageUrl] : [],
      status: "PENDING",
      rejectionReason: null,
      approvedById: null,
      approvedAt: null,
    },
  });

  revalidatePath("/business/deals");
  revalidatePath(`/deals/${dealId}`);
  return { success: "Deal updated and resubmitted for review." };
}

export async function updateBusinessProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const business = await getOwnedBusinessOrThrow(user.id);

  const parsed = businessRegistrationSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    countyId: formData.get("countyId"),
    location: formData.get("location"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || "",
    description: formData.get("description"),
    logoUrl: formData.get("logoUrl") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const data = parsed.data;
  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: data.name,
      categoryId: data.categoryId,
      countyId: data.countyId,
      location: data.location,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      description: data.description,
      logoUrl: data.logoUrl || null,
    },
  });

  revalidatePath("/business");
  revalidatePath(`/businesses/${business.id}`);
  return { success: "Business profile updated." };
}

export async function withdrawDealAction(dealId: string) {
  const user = await requireUser();
  const business = await getOwnedBusinessOrThrow(user.id);

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.businessId !== business.id) {
    throw new Error("Deal not found.");
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "SUSPENDED" },
  });

  revalidatePath("/business/deals");
  revalidatePath(`/deals/${dealId}`);
}
