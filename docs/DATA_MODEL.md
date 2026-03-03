# DATA_MODEL

Insight Artistico - Data Model v1 (designed to scale to 50k artists)

## Scope
This document defines:
- current relational schema already implemented in Supabase migration
- indexing and access patterns
- scaling strategy for ~50k onboarded artists

Reference migration:
- `supabase/migrations/0001_release1_foundation.sql`
- `supabase/migrations/0002_initial_schema.sql` (artists + daily metrics)

How to apply the initial SQL locally:
- Open Supabase Console → Database → SQL Editor and paste the contents of `supabase/migrations/0002_initial_schema.sql` and Execute.
- Add your Project URL and keys to `.env.local` (see `.env.local.example`).
- Run a manual ingestion to verify (example below):

Run example ingestion (manual):
```
# export env vars (PowerShell example)
setx NEXT_PUBLIC_SUPABASE_URL "https://your-project-ref.supabase.co"
setx SUPABASE_SERVICE_ROLE_KEY "<service-role-key>"
setx SPOTIFY_TOKEN "Bearer <spotify-token>"

# then run the script (requires node >=18 for fetch)
node scripts/ingest-spotify.ts <spotifyArtistId>
```

## Entity Overview

### `profiles`
User profile extension from `auth.users`.

Columns:
- `id uuid PK` (FK -> `auth.users.id`)
- `email text not null`
- `locale text not null default 'pt-BR'`
- `created_at timestamptz not null`

### `artists`
Canonical artist record linked by Spotify ID.

Columns:
- `id uuid PK`
- `spotify_artist_id text unique not null`
- `name text not null`
- `spotify_url text not null`
- `created_at timestamptz not null`

### `user_artist_links`
Enforces one artist per user in MVP.

Columns:
- `user_id uuid PK` (FK -> `auth.users.id`)
- `artist_id uuid not null` (FK -> `artists.id`)
- `created_at timestamptz not null`

### `artist_snapshots_daily`
Daily artist-level snapshot storage.

Columns:
- `id uuid PK`
- `artist_id uuid not null`
- `snapshot_date date not null`
- `streams_total bigint`
- `monthly_listeners bigint`
- `followers_total bigint`
- `top_track_name text`
- `data_confidence text check ('high','medium','low')`
- `source text not null`
- `created_at timestamptz not null`

Constraint:
- `unique (artist_id, snapshot_date)`

### `track_snapshots_daily`
Daily top tracks with estimated stream distribution.

Columns:
- `id uuid PK`
- `artist_id uuid not null`
- `snapshot_date date not null`
- `spotify_track_id text not null`
- `track_name text not null`
- `track_streams_estimated bigint not null`
- `rank_position int check (> 0)`

Constraint:
- `unique (artist_id, snapshot_date, spotify_track_id)`

### `derived_metrics_daily`
Computed metrics persisted by day.

Columns:
- `id uuid PK`
- `artist_id uuid not null`
- `snapshot_date date not null`
- `streams_per_listener numeric(12,4) not null`
- `retention_index_est numeric(8,2) not null`
- `engagement_index numeric(12,4) not null`
- `trend_status text check ('up','stable','down')`
- `weekly_growth_pct numeric(8,2) not null`

Constraint:
- `unique (artist_id, snapshot_date)`

### `alerts`
Business + technical alerts available in dashboard.

Columns:
- `id uuid PK`
- `artist_id uuid not null`
- `snapshot_date date not null`
- `alert_type text not null`
- `severity text check ('info','warning','critical')`
- `title text not null`
- `description text not null`
- `is_read boolean not null default false`
- `created_at timestamptz not null`

Constraint:
- `unique (artist_id, snapshot_date, alert_type)`

### `subscriptions`
Stripe linkage and entitlement source of truth.

Columns:
- `id uuid PK`
- `user_id uuid unique not null`
- `stripe_customer_id text unique`
- `stripe_subscription_id text unique`
- `plan text check ('free','pro')`
- `status text not null`
- `current_period_end timestamptz`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `ingestion_jobs`
Idempotency + monitoring for daily ingestion.

Columns:
- `id uuid PK`
- `artist_id uuid not null`
- `job_date date not null`
- `status text check ('running','success','failed')`
- `error_message text`
- `started_at timestamptz not null`
- `finished_at timestamptz`

Constraint:
- `unique (artist_id, job_date)`

## Relationships
- `profiles` 1:1 `auth.users`
- `user_artist_links.user_id` -> `auth.users.id`
- `user_artist_links.artist_id` -> `artists.id`
- all snapshot/metric/alert/job tables -> `artists.id`
- `subscriptions.user_id` -> `auth.users.id`

## Current Indexes
- `idx_user_artist_links_artist (artist_id)`
- `idx_artist_snapshots_artist_date (artist_id, snapshot_date desc)`
- `idx_track_snapshots_artist_date (artist_id, snapshot_date desc)`
- `idx_metrics_artist_date (artist_id, snapshot_date desc)`
- `idx_alerts_artist_date (artist_id, snapshot_date desc)`
- `idx_ingestion_jobs_artist_date (artist_id, job_date desc)`

## RLS and Tenant Isolation
Enabled for all product tables.

Policy strategy:
- user can only read/update records linked by `user_artist_links`
- user can only read/update own `subscriptions` and `profiles`
- write-heavy server flows use service role key on backend routes/jobs

## Scale Model for 50k Artists

Assumptions:
- 50,000 active artists
- daily ingestion cadence
- average 10 tracks persisted per artist per day

Estimated yearly row volume:
- `artist_snapshots_daily`: 50,000 x 365 = 18.25M rows/year
- `derived_metrics_daily`: 18.25M rows/year
- `track_snapshots_daily`: 500,000 x 365 = 182.5M rows/year
- `alerts`: depends on thresholds (typically << snapshots)
- `ingestion_jobs`: 18.25M rows/year

## Required Scale Upgrades (Phase 2)

### 1) Partition hot tables by month
Apply declarative partitioning by `snapshot_date` / `job_date` for:
- `artist_snapshots_daily`
- `derived_metrics_daily`
- `track_snapshots_daily`
- `alerts`
- `ingestion_jobs`

Why:
- smaller indexes per partition
- faster retention/archive operations
- better vacuum behavior

### 2) Add covering indexes for dashboard query paths
Examples:
- latest snapshot per artist: `(artist_id, snapshot_date desc) include (...)`
- alerts feed: `(artist_id, snapshot_date desc, severity)`
- track rank lookup: `(artist_id, snapshot_date desc, rank_position)`

### 3) Introduce retention policy for raw track data
Recommended:
- keep full `track_snapshots_daily` for 12 months online
- move older partitions to cold storage/warehouse
- keep monthly aggregates online for long-horizon charts

### 4) Ingestion concurrency controls
- process artists in batches/shards (e.g. 500-1000 per worker)
- lock per artist/day via `ingestion_jobs` unique constraint
- retry queue for failed artists only

### 5) Observability tables/metrics
Track per run:
- latency per source
- success/fail rates
- fallback rate (`data_confidence='low'`)
- job duration percentile (p50/p95/p99)

## Future Data Model Extensions

Phase 2 additions:
- `oauth_connections` (spotify refresh/access token metadata)
- `pro_artist_metrics_daily` (save/skip/completion/city/source breakdown)
- `insight_scores_daily` (artist/track scoring outputs)
- `webhook_events` (stripe event audit log with idempotency key)

Phase 3 additions:
- `labels` and `label_artist_links` for multi-artist accounts
- `notification_rules` and `notification_deliveries`

## Migration Governance
- one migration per logical change set
- backward-compatible rollout first, destructive changes later
- add columns nullable + backfill + enforce constraints in final step
- never remove indexes without workload evidence (query plans + metrics)
