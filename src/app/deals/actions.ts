"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

export async function toggleSavedDeal(dealId: string) {
  const user = await requireUser();

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found.");

  // Enforce uniqueness at the application layer too (DB has a unique
  // constraint as the authoritative guard against duplicate saves).
  const existing = await prisma.savedDeal.findUnique({
    where: { userId_dealId: { userId: user.id, dealId } },
  });

  if (existing) {
    await prisma.savedDeal.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedDeal.create({ data: { userId: user.id, dealId } });
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/saved");
  return { saved: !existing };
}

export async function isDealSavedByCurrentUser(dealId: string): Promise<boolean> {
  try {
    const user = await requireUser();
    const existing = await prisma.savedDeal.findUnique({
      where: { userId_dealId: { userId: user.id, dealId } },
    });
    return Boolean(existing);
  } catch (e) {
    if (e instanceof AuthError) return false;
    throw e;
  }
}
