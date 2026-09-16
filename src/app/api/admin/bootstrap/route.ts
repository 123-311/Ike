import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { seedReferenceData, ensureAdmin, seedDemoData } from "@/lib/seedData";

// One-time production bootstrap: seeds reference data (counties,
// categories, packages, platform settings) and, only if no admin account
// exists yet, creates one with a freshly generated password returned
// exactly once in the response. Never overwrites an existing admin's
// password, so it's safe to hit again by accident (it just re-syncs
// reference data, which is idempotent).
//
// Gated by AUTH_SECRET itself rather than a separate variable — anyone
// who already has AUTH_SECRET can forge a session as any user, so this
// doesn't widen what a leaked AUTH_SECRET can do. Query-string auth is
// used (not a header) because this is meant to be hit from a plain
// browser/fetch with no custom headers; treat it as a one-time setup
// step, not a routinely-called endpoint.
export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("email") ?? "admin@mtaanideals.co.ke";
  const includeDemo = request.nextUrl.searchParams.get("demo") !== "false";

  await seedReferenceData(prisma);

  const existingAdminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  let adminCreated = false;
  let adminPassword: string | null = null;

  if (existingAdminCount === 0) {
    adminPassword = crypto.randomBytes(12).toString("base64url");
    const result = await ensureAdmin(prisma, email, await bcrypt.hash(adminPassword, 12));
    adminCreated = result.created;
  }

  if (includeDemo) {
    await seedDemoData(prisma);
  }

  return NextResponse.json({
    ok: true,
    adminCreated,
    adminEmail: adminCreated ? email : undefined,
    adminPassword: adminCreated ? adminPassword : undefined,
    note: adminCreated
      ? "Save this password now — it will not be shown again. Change it after logging in."
      : "An admin already exists; reference data was re-synced and no new admin was created.",
  });
}
