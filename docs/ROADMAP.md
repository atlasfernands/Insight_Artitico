# ROADMAP

Insight Artistico - Delivery Roadmap

## Phase 0 - Foundation (done)
- Next.js app with API routes
- Supabase Auth + Postgres + RLS schema
- Daily ingestion endpoint with idempotency
- Dashboard MVP (overview, tracks, alerts)
- Stripe checkout + webhook integration
- Unit tests for metrics, parser, alerts

## Phase 1 - MVP Hardening (current)
- create `.env.local` setup guide for team onboarding
- complete smoke tests against real Supabase project
- add integration tests for onboarding + billing webhook
- add dashboard loading/error states with telemetry
- production deploy checklist for Vercel

## Phase 2 - Pro Data Expansion
- Spotify for Artists OAuth flow
- advanced metrics persistence (saves, skips, completion, traffic sources)
- Pro dashboard cards and comparative views
- feature gating refinement by entitlement status

## Phase 3 - Scale to 50k Artists
- partitioning of snapshot tables by month
- ingestion queue workers + sharding
- retry and dead-letter handling for failed ingestions
- archival policy for track-level history
- SLO dashboards for ingestion and API latency

## Phase 4 - Multi-Artist and Label
- account model upgrade: user -> org/label
- multi-artist dashboards and portfolio score
- role-based access control (owner, manager, analyst)
- label billing plans

## Phase 5 - Mobile App
- React Native / Expo app consuming same API contract
- auth session sync and secure token handling
- mobile dashboards with push-ready alert center
- deep links from alerts to artist insights

## Phase 6 - Intelligence Layer
- insight score model per artist/track/release window
- recommendation engine (actionable next steps)
- anomaly detection for growth and retention shifts
- alert personalization and notification channels

## Delivery Cadence Recommendation
- 2-week sprints
- each sprint closes with:
  - tested migration set
  - API contract updates in `docs/API_SPEC.md`
  - data model updates in `docs/DATA_MODEL.md`
  - release notes in PR description
