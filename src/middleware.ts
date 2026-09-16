import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Defense-in-depth only: this can't check role or isActive (no DB access
// in edge middleware), so it just bounces requests with no valid session
// cookie away from protected sections before they reach the app. The
// real authorization — role checks, ownership checks — happens server-side
// in every page/action itself (see requireAdmin/requireUser in lib/auth.ts)
// and remains authoritative regardless of what this middleware does.
export const config = {
  matcher: ["/admin/:path*", "/business/:path*"],
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("mtaani_session")?.value;
  const secret = getSecret();

  if (token && secret) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      // fall through to redirect
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
