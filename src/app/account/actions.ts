"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";
import { phoneSchema } from "@/lib/validation/schemas";

export type ProfileActionState = { error?: string; success?: string } | undefined;

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
});

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const phoneTaken = await prisma.user.findFirst({
    where: { phone: parsed.data.phone, NOT: { id: user.id } },
  });
  if (phoneTaken) {
    return { error: "That phone number is already in use by another account." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone },
  });

  revalidatePath("/account");
  return { success: "Profile updated." };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { success: "Password changed." };
}
