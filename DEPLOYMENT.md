# Deployment guide

This app has not been deployed anywhere by this build — it only exists in
this repository and a local dev database. Read this before deploying.

## 1. Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. Use a managed Postgres (RDS, Neon, Supabase, Railway, etc.) in production. |
| `AUTH_SECRET` | yes | Signs session JWTs. `openssl rand -base64 48`. Rotating it invalidates all sessions. |
| `NODE_ENV` | yes | `production` on a real deployment — this also makes session cookies `Secure`. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seed-time only | Used once by `prisma db seed` to create the bootstrap admin. Change the password immediately after first login; these values aren't read again afterward. |
| `CRON_SECRET` | yes, for expiry automation | `openssl rand -hex 32`. Required by your scheduler to call `/api/cron/sweep-expired`. |
| `SEED_DEMO_DATA` | optional | Set to `false` before seeding a production database to skip demo businesses/deals. |
| `DISABLE_RATE_LIMIT` | never in production | Only set by `playwright.config.ts` for the test suite's own server process. |

None of these are committed — `.env` is gitignored, `.env.example` has
placeholders only.

## 2. Database

```bash
npx prisma migrate deploy   # applies committed migrations, no prompts
npx prisma db seed          # counties, categories, packages, settings, admin
```

Take this seriously before launch:

- **Backups**: configure automated backups on whatever Postgres host you
  use (point-in-time recovery if available). Nothing in this app does
  its own backups.
- **Connection pooling**: if deploying to a serverless platform (Vercel,
  etc.), put a pooler (PgBouncer, Neon's built-in pooler, Prisma
  Accelerate) in front of Postgres — serverless functions open many
  short-lived connections.

## 3. Scheduled expiry sweep

Deals/promotions never *display* as active past expiry (every read query
filters by date), but their stored `status` field only flips to
`EXPIRED` when swept — either opportunistically on admin page loads, or
via:

```
GET /api/cron/sweep-expired
Authorization: Bearer <CRON_SECRET>
```

Configure your host's scheduler to hit this every 5–15 minutes (Vercel
Cron's `vercel.json`, a GitHub Actions scheduled workflow, a systemd
timer on a VPS, etc.).

## 4. File uploads — not yet implemented

Deal photos and business logos currently accept an **image URL** (validated
server-side: must be `https://` and end in a common image extension),
not a file upload. There is no storage backend configured in this
environment. Before launch, if real file upload is wanted:

1. Pick a storage backend (S3, Cloudinary, Vercel Blob, Supabase Storage).
2. Add an upload endpoint that: validates the MIME type against an
   allowlist (`image/png`, `image/jpeg`, `image/webp`), checks actual
   file bytes (magic numbers) rather than trusting the extension, caps
   file size (e.g. 5MB), and stores the file under a random key — never
   the user-supplied filename.
3. Replace the `imageUrl`/`logoUrl` text inputs in
   `src/components/business/DealForm.tsx` and the business forms with
   the upload widget, and swap `imageUrlSchema` (`src/lib/validation/schemas.ts`)
   for whatever the upload endpoint returns.

## 5. M-PESA — still fully manual

There is no Safaricom Daraja API integration. The flow is exactly what
the product spec asked for: business submits a transaction code →
`PENDING_VERIFICATION` → an admin manually checks their actual M-PESA
statement and clicks Verify or Reject. Nothing here fakes or assumes
payment success. Automating verification later (Daraja C2B/STK Push)
would slot in at `src/app/admin/actions.ts` (`verifyPaymentAction`) —
the activation logic (start/end dates, status transitions) is already
isolated there and doesn't need to change, only how verification is
triggered.

## 6. Before going live — checklist

- [ ] Set a real `mpesa_receiving_number` in Admin → Platform Settings
      (starts empty/disabled on purpose — see `prisma/seed.ts`)
- [ ] Set `payment_receiving_status` to `ENABLED` once the number is confirmed correct
- [ ] Change the seed admin's password (or delete it and create a real
      admin account, then revoke the seed one)
- [ ] Review/adjust promotion package prices in Admin → Packages
- [ ] Set `SEED_DEMO_DATA=false` or delete demo rows (`isDemo = true`)
- [ ] Configure the cron sweep (§3)
- [ ] Point `DATABASE_URL` at a production Postgres with backups enabled
- [ ] Set `NODE_ENV=production`
- [ ] Run `npm run build` once locally/in CI to confirm a clean production build
- [ ] Run `npm run test:e2e` against a disposable database
