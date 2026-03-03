# Insight Artitico - Release 1 Foundation

Vertical slice SaaS em `Next.js + Supabase + Stripe + Vercel` para análise estratégica de streams.

## O que esta base já entrega

- Auth por magic link com Supabase.
- Onboarding por URL/ID do artista Spotify.
- Pipeline diário de ingestão (`/api/internal/ingest/daily`) com idempotência por data.
- Dashboard com KPIs, métricas derivadas, ranking de faixas e alertas.
- Billing Stripe com checkout e webhook para entitlement `free/pro`.
- Observabilidade com Sentry (configuração inicial).
- Migração SQL com RLS e políticas de isolamento por usuário.
- Testes unitários para fórmulas, parsing Spotify e alertas.

## Stack

- `Next.js App Router` (TypeScript)
- `Supabase` (Postgres + Auth + RLS)
- `Stripe` (Checkout + Webhook)
- `Vercel` (deploy + cron diário)
- `Sentry` (error tracking)

## Setup local

1. Instale dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `INGEST_CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- opcionais: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `PUBLIC_METRICS_ENDPOINT`, `SENTRY_*`

3. Rode a migração SQL no Supabase:

- arquivo: `supabase/migrations/0001_release1_foundation.sql`

4. Rode a aplicação:

```bash
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Endpoints principais

- `POST /api/auth/magic-link`
- `POST /api/onboarding/artist`
- `GET /api/dashboard/overview?range=30d`
- `GET /api/dashboard/tracks?range=30d`
- `GET /api/dashboard/alerts?range=30d`
- `POST /api/billing/create-checkout-session`
- `POST /api/stripe/webhook`
- `POST /api/internal/ingest/daily` (usa secret)

## Cron em produção

`vercel.json` agenda ingestão diária em `08:15 UTC` (`05:15 BRT`).

## Observações de produto

- MVP suporta `1 artista por conta`.
- Alertas iniciais apenas no dashboard.
- Conexão OAuth Spotify for Artists está planejada para fase 2.
