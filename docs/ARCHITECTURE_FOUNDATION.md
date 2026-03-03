# ARCHITECTURE_FOUNDATION

Strategic Blueprint - Insight Artistico SaaS

## Product Vision
Insight Artistico converts streaming platform signals into strategic decisions for independent artists, managers, and small labels.

The product starts with Spotify data (public + official API where available), then expands to authenticated data and other platforms.

## Core Problem
Artists can see numbers, but cannot interpret what to do next.

## Product Promise
- Transform visible metrics into clear trend diagnosis.
- Prioritize actions (what to push, when to release, where to invest).
- Make growth behavior explainable via score + alerts.

## Target Audience
- Independent artists with active releases.
- Managers handling one or more artists.
- Small labels with limited analytics tooling.

## Plans
### Free (MVP)
- Total streams
- Monthly listeners
- Followers
- Top track
- Weekly growth estimate
- Internal track ranking
- Streams per listener
- Estimated retention index
- Engagement index (streams/followers)
- Trend status (up/stable/down)

### Pro (Phase 2+)
- Spotify for Artists OAuth connection
- Save/skip/completion metrics
- Audience geography and demographics
- Traffic source split
- Advanced diagnostics + custom alerts

## System Architecture
### Layer 1 - Collection
- Spotify Web API adapter
- Public metrics adapter (structured collector)
- Fallback strategy to last valid snapshot

### Layer 2 - Processing
- Daily ingestion jobs
- Metric normalization
- Derived metric engine
- Historical persistence

### Layer 3 - Intelligence
- Trend classification
- Business alert generation
- Score/insight engine (phase 2)

### Layer 4 - Presentation
- Web dashboard (Next.js)
- Alerts panel
- Billing and plan gating
- Mobile client planned using same API contract

## Revenue Model
- Free tier for discovery and onboarding
- Pro tier for deep diagnostics and premium metrics
- Future Label tier for multi-artist operations

## Technical Foundation (Current)
- Next.js App Router (web + API routes)
- Supabase Auth + Postgres + RLS
- Stripe Checkout + Webhooks
- Vercel cron for daily ingestion
- Sentry for observability
