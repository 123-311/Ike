import { NextRequest, NextResponse } from "next/server";
import { sweepExpired } from "@/lib/promotions";

// Intended to be called on a schedule (e.g. every 5-15 minutes) by the
// hosting platform's cron/scheduled-function feature. Read-path queries
// already filter by date directly, so this endpoint is a housekeeping
// pass (keeps stored status fields accurate for admin views and reports)
// rather than the sole guard against showing expired content.
//
// Protect with CRON_SECRET in production: configure the scheduler to send
// `Authorization: Bearer <CRON_SECRET>`. If CRON_SECRET is not set, the
// endpoint refuses all requests rather than running unauthenticated.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sweepExpired();
  return NextResponse.json({ ok: true, expired: result });
}
