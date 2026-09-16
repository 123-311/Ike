import "server-only";

// Simple in-memory fixed-window rate limiter for a single-instance
// deployment. Good enough to blunt credential-stuffing and payment-spam
// attempts on a small platform. If Mtaani Deals is scaled to multiple
// server instances, replace this with a shared store (e.g. Redis) — the
// call sites (checkRateLimit) would not need to change.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  // Escape hatch for the automated e2e test suite only, which legitimately
  // needs to register/log in far more than a real visitor would in a
  // short window. Never set DISABLE_RATE_LIMIT in a real deployment — see
  // playwright.config.ts, which is the only place that sets it.
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return { allowed: true, retryAfterMs: 0 };
  }

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically drop stale buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();
