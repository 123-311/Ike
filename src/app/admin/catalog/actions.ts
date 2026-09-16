"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import {
  categoryUpsertSchema,
  countyUpsertSchema,
  packageUpsertSchema,
} from "@/lib/validation/schemas";

export type CatalogFormState = { error?: string; success?: string } | undefined;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategoryAction(
  _prev: CatalogFormState,
  formData: FormData
): Promise<CatalogFormState> {
  const admin = await requireAdmin();
  const parsed = categoryUpsertSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category." };

  const existing = await prisma.category.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "A category with that name already exists." };

  await prisma.category.create({
    data: { name: parsed.data.name, slug: slugify(parsed.data.name), icon: parsed.data.icon },
  });
  await logAdminAction({ adminId: admin.id, action: "CREATE_CATEGORY", entityType: "Category", entityId: parsed.data.name });
  revalidatePath("/admin/categories");
  return { success: "Category added." };
}

export async function toggleCategoryActiveAction(categoryId: string, active: boolean) {
  const admin = await requireAdmin();
  await prisma.category.update({ where: { id: categoryId }, data: { active } });
  await logAdminAction({
    adminId: admin.id,
    action: active ? "ACTIVATE_CATEGORY" : "DEACTIVATE_CATEGORY",
    entityType: "Category",
    entityId: categoryId,
  });
  revalidatePath("/admin/categories");
}

export async function createCountyAction(
  _prev: CatalogFormState,
  formData: FormData
): Promise<CatalogFormState> {
  const admin = await requireAdmin();
  const parsed = countyUpsertSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid county." };

  const existing = await prisma.county.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "A county with that name already exists." };

  await prisma.county.create({ data: parsed.data });
  await logAdminAction({ adminId: admin.id, action: "CREATE_COUNTY", entityType: "County", entityId: parsed.data.name });
  revalidatePath("/admin/counties");
  return { success: "County added." };
}

export async function toggleCountyActiveAction(countyId: string, active: boolean) {
  const admin = await requireAdmin();
  await prisma.county.update({ where: { id: countyId }, data: { active } });
  await logAdminAction({
    adminId: admin.id,
    action: active ? "ACTIVATE_COUNTY" : "DEACTIVATE_COUNTY",
    entityType: "County",
    entityId: countyId,
  });
  revalidatePath("/admin/counties");
}

export async function createPackageAction(
  _prev: CatalogFormState,
  formData: FormData
): Promise<CatalogFormState> {
  const admin = await requireAdmin();
  const parsed = packageUpsertSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationDays: formData.get("durationDays"),
    price: formData.get("price"),
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid package." };

  await prisma.promotionPackage.create({ data: parsed.data });
  await logAdminAction({
    adminId: admin.id,
    action: "CREATE_PACKAGE",
    entityType: "PromotionPackage",
    entityId: parsed.data.name,
    details: parsed.data,
  });
  revalidatePath("/admin/packages");
  revalidatePath("/business/promote");
  return { success: "Package created." };
}

export async function updatePackageAction(
  packageId: string,
  _prev: CatalogFormState,
  formData: FormData
): Promise<CatalogFormState> {
  const admin = await requireAdmin();
  const existing = await prisma.promotionPackage.findUnique({ where: { id: packageId } });
  if (!existing) return { error: "Package not found." };

  const parsed = packageUpsertSchema.safeParse({
    type: existing.type,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationDays: formData.get("durationDays"),
    price: formData.get("price"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid package." };

  await prisma.promotionPackage.update({ where: { id: packageId }, data: parsed.data });
  await logAdminAction({
    adminId: admin.id,
    action: "UPDATE_PACKAGE",
    entityType: "PromotionPackage",
    entityId: packageId,
    details: parsed.data,
  });
  revalidatePath("/admin/packages");
  revalidatePath("/business/promote");
  return { success: "Package updated." };
}
