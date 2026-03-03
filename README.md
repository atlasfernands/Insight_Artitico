# Insight Artitico - Release 1 Foundation

SaaS foundation for stream analytics using `Next.js + Supabase + Stripe + Vercel`.

## What is implemented
- Magic link auth with Supabase
- Artist onboarding by Spotify URL/ID
- Daily ingestion endpoint with idempotency
- Dashboard APIs (overview, tracks, alerts)
- Stripe checkout + webhook for plan entitlement
- Supabase SQL schema with RLS
- Unit tests for metrics, alerts, and parser

## Project docs (source of truth)
- `docs/ARCHITECTURE_FOUNDATION.md`
- `docs/API_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/ROADMAP.md`

## Stack
- Next.js App Router (TypeScript)
- Supabase (Postgres + Auth + RLS)
- Stripe (Checkout + Webhook)
- Vercel (deploy + cron)
- Sentry (observability)

## Local setup
1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `INGEST_CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- **optionally** for manual ingestion:
  - `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` (or provide `SPOTIFY_TOKEN`)

3. Apply SQL migration:
   - `supabase/migrations/0001_release1_foundation.sql`

4. Run app:

```bash
npm run dev
```

5. Manual ingestion example (after setting Spotify credentials):

```bash
npm run ingest -- 1vCWHaC5f2uS3yhpwWbIA6
```

6. If testing Stripe webhook locally, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Apply SQL migration:
- `supabase/migrations/0001_release1_foundation.sql`

4. Run app:

```bash
npm run dev
```

5. If testing Stripe webhook locally, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

6. Optional simplification during early product validation:
- keep Stripe disabled temporarily
- set user plan manually in `subscriptions.plan` as `free` or `pro`

## Commands
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Main endpoints
- `POST /api/auth/magic-link`
- `POST /api/onboarding/artist`
- `GET /api/dashboard/overview?range=30d`
- `GET /api/dashboard/tracks?range=30d`
- `GET /api/dashboard/alerts?range=30d`
- `POST /api/billing/create-checkout-session`
- `POST /api/stripe/webhook`
- `POST /api/internal/ingest/daily`

## Notes
- MVP supports 1 artist per account.
- Pro OAuth integration is planned for phase 2.
- Daily cron is configured in `vercel.json` at `08:15 UTC` (`05:15 BRT`).
