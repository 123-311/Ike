"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { logAdminAction } from "@/lib/audit";
import { settingsUpdateSchema } from "@/lib/validation/schemas";

export type SettingsFormState = { error?: string; success?: string } | undefined;

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const admin = await requireAdmin();

  const parsed = settingsUpdateSchema.safeParse({
    mpesa_receiving_number: formData.get("mpesa_receiving_number") || "",
    payment_instructions: formData.get("payment_instructions") || undefined,
    payment_receiving_status: formData.get("payment_receiving_status") || undefined,
    supported_payment_method_label: formData.get("supported_payment_method_label") || undefined,
    brand_tagline: formData.get("brand_tagline") || undefined,
    max_active_deals_per_business: formData.get("max_active_deals_per_business") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const updates: [string, string | undefined][] = [
    [SETTING_KEYS.MPESA_RECEIVING_NUMBER, parsed.data.mpesa_receiving_number],
    [SETTING_KEYS.PAYMENT_INSTRUCTIONS, parsed.data.payment_instructions],
    [SETTING_KEYS.PAYMENT_RECEIVING_STATUS, parsed.data.payment_receiving_status],
    [SETTING_KEYS.PAYMENT_METHOD_LABEL, parsed.data.supported_payment_method_label],
    [SETTING_KEYS.BRAND_TAGLINE, parsed.data.brand_tagline],
    [
      SETTING_KEYS.MAX_ACTIVE_DEALS_PER_BUSINESS,
      parsed.data.max_active_deals_per_business?.toString(),
    ],
  ];

  for (const [key, value] of updates) {
    if (value !== undefined) {
      await setSetting(key, value, admin.id);
    }
  }

  await logAdminAction({
    adminId: admin.id,
    action: "UPDATE_PLATFORM_SETTINGS",
    entityType: "PlatformSetting",
    entityId: "bulk",
    details: Object.fromEntries(updates.filter(([, v]) => v !== undefined)),
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/business/promote/pay");
  return { success: "Settings updated." };
}
