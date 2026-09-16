# Mtaani Deals

A Kenya-focused local deals marketplace. Customers discover genuine local
offers by category and county; businesses register, list deals, and pay
for promotional visibility; the platform owner controls verification,
payments and platform settings from an admin dashboard.

Built with Next.js (App Router, TypeScript), PostgreSQL, and Prisma.
Mobile-first, server-rendered, no client-side framework beyond React.

## Stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: bcrypt password hashing + signed httpOnly JWT session cookies
  (see `src/lib/auth.ts`) — no third-party auth provider
- **Styling**: Tailwind CSS v4
- **Tests**: Playwright end-to-end suite (`tests/e2e`)

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Have a PostgreSQL server running and create a database.
3. Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — generate with `openssl rand -base64 48`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — bootstrap admin account
     created by the seed script; change the password after first login
   - `CRON_SECRET` — generate with `openssl rand -hex 32` (see below)
4. Run migrations and seed reference data (47 counties, categories,
   promotion packages, platform settings, one demo dataset):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and start
- `npm run lint` — ESLint
- `npm run test:e2e` — Playwright end-to-end test suite (spins up its own
  dev server instance with rate limiting disabled — see below)

## Expiring deals and promotions

Every customer-facing query filters by date directly, so an expired
deal/promotion is never shown regardless of background jobs. A
housekeeping sweep also flips stored `status` fields to `EXPIRED` for
accurate admin reporting:

- Runs opportunistically on every admin page load (`src/app/admin/layout.tsx`)
- Exposed as `GET /api/cron/sweep-expired`, protected by
  `Authorization: Bearer <CRON_SECRET>`, intended to be called every
  5–15 minutes by your hosting platform's scheduler (Vercel Cron, a
  systemd timer, etc.) — see `DEPLOYMENT.md`.

## Tests

`tests/e2e` is a Playwright suite covering authentication, RBAC, business
registration and deal CRUD, the marketplace, the manual M-PESA payment
flow, admin moderation and the payments queue, and the visibility/
ownership security rules (pending/rejected/expired content never public,
cross-business isolation). Run with:

```bash
npm run test:e2e
```

The suite's own dev server process sets `DISABLE_RATE_LIMIT=true`
(`playwright.config.ts`) so the test run's many registrations/logins
aren't blocked by the same rate limiter real traffic goes through. This
variable must never be set in a real deployment.

## Demo data

The seed script creates a few businesses/deals with `isDemo: true`
(shown with a visible "DEMO" badge everywhere they appear) so the
marketplace isn't empty on first run. Set `SEED_DEMO_DATA=false` before
seeding to skip them, or delete `Business`/`User` rows where
`isDemo = true` / the email ends in `@mtaanideals.demo` before a real
launch.

See `DEPLOYMENT.md` for production deployment steps and remaining
configuration required before public launch.
