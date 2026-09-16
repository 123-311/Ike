/**
 * Seeds reference data (counties, categories, promotion packages, platform
 * settings) plus one bootstrap admin and a small set of clearly-labeled
 * demo businesses/deals for local development and evaluation.
 *
 * Demo data (isDemo = true) must be removed before a real public launch —
 * see DEPLOYMENT.md.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedReferenceData, ensureAdmin, seedDemoData } from "../src/lib/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding reference data (counties, categories, settings, packages)...");
  await seedReferenceData(prisma);

  console.log("Seeding bootstrap admin...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@mtaanideals.co.ke";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  await ensureAdmin(prisma, adminEmail, await bcrypt.hash(adminPassword, 12));

  if (process.env.SEED_DEMO_DATA !== "false") {
    console.log("Seeding demo businesses and deals (clearly marked isDemo=true)...");
    await seedDemoData(prisma);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
