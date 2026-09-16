import "server-only";
import { prisma } from "@/lib/db";
import { cache } from "react";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/constants/settings";

export { SETTING_KEYS, DEFAULT_SETTINGS };

// Cached per-request so pages/actions can call getSetting repeatedly
// without hammering the database.
export const getAllSettings = cache(async () => {
  const rows = await prisma.platformSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  // Fill in defaults for any key not yet present in the database.
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (!map.has(key)) map.set(key, def.value);
  }
  return map;
});

export async function getSetting(key: string): Promise<string> {
  const settings = await getAllSettings();
  return settings.get(key) ?? DEFAULT_SETTINGS[key]?.value ?? "";
}

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const raw = await getSetting(key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function setSetting(key: string, value: string, updatedById: string) {
  return prisma.platformSetting.upsert({
    where: { key },
    create: {
      key,
      value,
      description: DEFAULT_SETTINGS[key]?.description ?? null,
      updatedById,
    },
    update: { value, updatedById },
  });
}
