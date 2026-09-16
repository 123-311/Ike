// Shared seeding logic — no "server-only" import, framework-agnostic (a
// PrismaClient is passed in) so it can be used both by the CLI seed
// script (prisma/seed.ts, via tsx) and the one-time production bootstrap
// API route (src/app/api/admin/bootstrap/route.ts).
import type { PrismaClient } from "@prisma/client";
import { calcDiscount } from "@/lib/discount";
import { DEFAULT_SETTINGS } from "@/lib/constants/settings";

// Official 47 Kenyan counties with IEBC numeric codes.
export const COUNTIES: [string, string][] = [
  ["Mombasa", "001"],
  ["Kwale", "002"],
  ["Kilifi", "003"],
  ["Tana River", "004"],
  ["Lamu", "005"],
  ["Taita Taveta", "006"],
  ["Garissa", "007"],
  ["Wajir", "008"],
  ["Mandera", "009"],
  ["Marsabit", "010"],
  ["Isiolo", "011"],
  ["Meru", "012"],
  ["Tharaka-Nithi", "013"],
  ["Embu", "014"],
  ["Kitui", "015"],
  ["Machakos", "016"],
  ["Makueni", "017"],
  ["Nyandarua", "018"],
  ["Nyeri", "019"],
  ["Kirinyaga", "020"],
  ["Murang'a", "021"],
  ["Kiambu", "022"],
  ["Turkana", "023"],
  ["West Pokot", "024"],
  ["Samburu", "025"],
  ["Trans Nzoia", "026"],
  ["Uasin Gishu", "027"],
  ["Elgeyo-Marakwet", "028"],
  ["Nandi", "029"],
  ["Baringo", "030"],
  ["Laikipia", "031"],
  ["Nakuru", "032"],
  ["Narok", "033"],
  ["Kajiado", "034"],
  ["Kericho", "035"],
  ["Bomet", "036"],
  ["Kakamega", "037"],
  ["Vihiga", "038"],
  ["Bungoma", "039"],
  ["Busia", "040"],
  ["Siaya", "041"],
  ["Kisumu", "042"],
  ["Homa Bay", "043"],
  ["Migori", "044"],
  ["Kisii", "045"],
  ["Nyamira", "046"],
  ["Nairobi", "047"],
];

export const CATEGORIES: [string, string][] = [
  ["Food & Restaurants", "utensils"],
  ["Beauty & Spa", "sparkles"],
  ["Fashion & Clothing", "shirt"],
  ["Electronics", "smartphone"],
  ["Home & Furniture", "sofa"],
  ["Automotive", "car"],
  ["Health & Fitness", "heart-pulse"],
  ["Entertainment", "ticket"],
  ["Travel & Hotels", "plane"],
  ["Education", "graduation-cap"],
  ["Professional Services", "briefcase"],
  ["Groceries & Supermarkets", "shopping-basket"],
  ["Salon & Barbershop", "scissors"],
  ["Real Estate", "home"],
  ["Other", "grid"],
];

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PACKAGES: {
  type: "BUSINESS_SUBSCRIPTION" | "FEATURED_BUSINESS" | "DEAL_BOOST" | "SPONSORED_DEAL" | "ADVERTISING";
  name: string;
  durationDays: number;
  price: number;
  active: boolean;
  sortOrder: number;
  description: string;
}[] = [
  {
    type: "BUSINESS_SUBSCRIPTION",
    name: "Annual Premium",
    durationDays: 365,
    price: 4000,
    active: true,
    sortOrder: 0,
    description: "Full business premium features for one year.",
  },
  { type: "FEATURED_BUSINESS", name: "Featured — 1 Day", durationDays: 1, price: 150, active: true, sortOrder: 0, description: "Featured placement for 1 day." },
  { type: "FEATURED_BUSINESS", name: "Featured — 7 Days", durationDays: 7, price: 700, active: true, sortOrder: 1, description: "Featured placement for 7 days." },
  { type: "FEATURED_BUSINESS", name: "Featured — 30 Days", durationDays: 30, price: 2200, active: true, sortOrder: 2, description: "Featured placement for 30 days." },
  { type: "FEATURED_BUSINESS", name: "Featured — 90 Days", durationDays: 90, price: 5500, active: true, sortOrder: 3, description: "Featured placement for 90 days." },
  { type: "FEATURED_BUSINESS", name: "Featured — 6 Months", durationDays: 180, price: 9500, active: true, sortOrder: 4, description: "Featured placement for 6 months." },
  { type: "FEATURED_BUSINESS", name: "Featured — 1 Year", durationDays: 365, price: 16000, active: true, sortOrder: 5, description: "Featured placement for 1 year." },
  { type: "DEAL_BOOST", name: "Boost — 1 Day", durationDays: 1, price: 100, active: true, sortOrder: 0, description: "Boosted visibility for 1 day." },
  { type: "DEAL_BOOST", name: "Boost — 7 Days", durationDays: 7, price: 450, active: true, sortOrder: 1, description: "Boosted visibility for 7 days." },
  { type: "DEAL_BOOST", name: "Boost — 30 Days", durationDays: 30, price: 1400, active: true, sortOrder: 2, description: "Boosted visibility for 30 days." },
  { type: "DEAL_BOOST", name: "Boost — 90 Days", durationDays: 90, price: 3600, active: true, sortOrder: 3, description: "Boosted visibility for 90 days." },
  { type: "DEAL_BOOST", name: "Boost — 6 Months", durationDays: 180, price: 6500, active: true, sortOrder: 4, description: "Boosted visibility for 6 months." },
  { type: "DEAL_BOOST", name: "Boost — 1 Year", durationDays: 365, price: 11000, active: true, sortOrder: 5, description: "Boosted visibility for 1 year." },
  { type: "SPONSORED_DEAL", name: "Sponsored Deal — 7 Days", durationDays: 7, price: 1000, active: false, sortOrder: 0, description: "Sponsored placement for 7 days (inactive until admin enables it)." },
  { type: "SPONSORED_DEAL", name: "Sponsored Deal — 30 Days", durationDays: 30, price: 3000, active: false, sortOrder: 1, description: "Sponsored placement for 30 days (inactive until admin enables it)." },
  { type: "ADVERTISING", name: "Homepage Banner — 7 Days", durationDays: 7, price: 2000, active: false, sortOrder: 0, description: "Homepage banner placement (inactive until admin enables it)." },
  { type: "ADVERTISING", name: "Homepage Banner — 30 Days", durationDays: 30, price: 6000, active: false, sortOrder: 1, description: "Homepage banner placement (inactive until admin enables it)." },
];

export async function seedReferenceData(prisma: PrismaClient) {
  for (const [name, code] of COUNTIES) {
    await prisma.county.upsert({ where: { name }, update: { code }, create: { name, code } });
  }

  for (const [name, icon] of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: { icon },
      create: { name, slug: slugify(name), icon },
    });
  }

  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: def.value, description: def.description },
    });
  }
  // Payment receiving stays DISABLED until an admin sets a real M-PESA
  // number — never ship with an assumed receiving number.
  await prisma.platformSetting.upsert({
    where: { key: "payment_receiving_status" },
    update: {},
    create: {
      key: "payment_receiving_status",
      value: "DISABLED",
      description: DEFAULT_SETTINGS["payment_receiving_status"].description,
    },
  });

  for (const pkg of PACKAGES) {
    const existing = await prisma.promotionPackage.findFirst({
      where: { type: pkg.type, name: pkg.name },
    });
    if (existing) {
      await prisma.promotionPackage.update({ where: { id: existing.id }, data: pkg });
    } else {
      await prisma.promotionPackage.create({ data: pkg });
    }
  }
}

// Creates the admin only if that email doesn't exist yet. Never touches
// passwordHash on an existing account — safe to call repeatedly without
// risk of clobbering a password the admin has since changed.
export async function ensureAdmin(prisma: PrismaClient, email: string, passwordHash: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    }
    return { created: false, userId: existing.id };
  }
  const user = await prisma.user.create({
    data: { name: "Mtaani Deals Admin", email, phone: null, passwordHash, role: "ADMIN" },
  });
  return { created: true, userId: user.id };
}

export async function seedDemoData(prisma: PrismaClient) {
  const bcrypt = await import("bcryptjs");
  const nairobi = await prisma.county.findUniqueOrThrow({ where: { name: "Nairobi" } });
  const mombasa = await prisma.county.findUniqueOrThrow({ where: { name: "Mombasa" } });
  const food = await prisma.category.findUniqueOrThrow({ where: { name: "Food & Restaurants" } });
  const beauty = await prisma.category.findUniqueOrThrow({ where: { name: "Beauty & Spa" } });
  const fashion = await prisma.category.findUniqueOrThrow({ where: { name: "Fashion & Clothing" } });

  const demoOwnerPassword = await bcrypt.hash("DemoOwner!2026", 12);

  const demoBusinessDefs = [
    {
      email: "demo.kilimanicafe@mtaanideals.demo",
      name: "Kilimani Corner Cafe (Demo)",
      categoryId: food.id,
      countyId: nairobi.id,
      location: "Kilimani, Nairobi",
      phone: "0700000001",
      whatsapp: "0700000001",
      description: "Sample cafe listing used to demonstrate the marketplace. Not a real business.",
      deals: [{ title: "Buy 1 Get 1 Coffee (Demo)", original: 500, deal: 300 }],
    },
    {
      email: "demo.mombasabeauty@mtaanideals.demo",
      name: "Nyali Beauty Studio (Demo)",
      categoryId: beauty.id,
      countyId: mombasa.id,
      location: "Nyali, Mombasa",
      phone: "0700000002",
      whatsapp: "0700000002",
      description: "Sample beauty studio listing used to demonstrate the marketplace. Not a real business.",
      deals: [{ title: "Full Spa Package (Demo)", original: 4000, deal: 2500 }],
    },
    {
      email: "demo.streetwear@mtaanideals.demo",
      name: "Tom Mboya Streetwear (Demo)",
      categoryId: fashion.id,
      countyId: nairobi.id,
      location: "Tom Mboya Street, Nairobi",
      phone: "0700000003",
      whatsapp: "0700000003",
      description: "Sample fashion retailer listing used to demonstrate the marketplace. Not a real business.",
      deals: [{ title: "End of Season Sneaker Sale (Demo)", original: 3500, deal: 2200 }],
    },
  ];

  for (const def of demoBusinessDefs) {
    const owner = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        name: `${def.name} Owner`,
        email: def.email,
        passwordHash: demoOwnerPassword,
        role: "CUSTOMER",
      },
    });

    let business = await prisma.business.findFirst({
      where: { ownerId: owner.id, name: def.name },
    });
    if (!business) {
      business = await prisma.business.create({
        data: {
          ownerId: owner.id,
          name: def.name,
          categoryId: def.categoryId,
          countyId: def.countyId,
          location: def.location,
          phone: def.phone,
          whatsapp: def.whatsapp,
          description: def.description,
          verificationStatus: "APPROVED",
          approvedAt: new Date(),
          isDemo: true,
        },
      });
    }

    for (const d of def.deals) {
      const exists = await prisma.deal.findFirst({
        where: { businessId: business.id, title: d.title },
      });
      if (exists) continue;
      const { discountPercent, savings } = calcDiscount(d.original, d.deal);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      await prisma.deal.create({
        data: {
          businessId: business.id,
          title: d.title,
          description: `${d.title} — sample deal for demonstration purposes only.`,
          originalPrice: d.original,
          dealPrice: d.deal,
          discountPercent,
          savings,
          categoryId: def.categoryId,
          countyId: def.countyId,
          location: def.location,
          expiryDate: expiry,
          status: "APPROVED",
          approvedAt: new Date(),
          isDemo: true,
        },
      });
    }
  }
}
