create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  spotify_artist_id text not null unique,
  name text not null,
  spotify_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_artist_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.artist_snapshots_daily (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  snapshot_date date not null,
  streams_total bigint,
  monthly_listeners bigint,
  followers_total bigint,
  top_track_name text,
  data_confidence text not null check (data_confidence in ('high', 'medium', 'low')),
  source text not null,
  created_at timestamptz not null default now(),
  unique (artist_id, snapshot_date)
);

create table if not exists public.track_snapshots_daily (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  snapshot_date date not null,
  spotify_track_id text not null,
  track_name text not null,
  track_streams_estimated bigint not null,
  rank_position int not null check (rank_position > 0),
  unique (artist_id, snapshot_date, spotify_track_id)
);

create table if not exists public.derived_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  snapshot_date date not null,
  streams_per_listener numeric(12,4) not null,
  retention_index_est numeric(8,2) not null,
  engagement_index numeric(12,4) not null,
  trend_status text not null check (trend_status in ('up', 'stable', 'down')),
  weekly_growth_pct numeric(8,2) not null,
  unique (artist_id, snapshot_date)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  snapshot_date date not null,
  alert_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  description text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (artist_id, snapshot_date, alert_type)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  job_date date not null,
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (artist_id, job_date)
);

create index if not exists idx_user_artist_links_artist on public.user_artist_links (artist_id);
create index if not exists idx_artist_snapshots_artist_date on public.artist_snapshots_daily (artist_id, snapshot_date desc);
create index if not exists idx_track_snapshots_artist_date on public.track_snapshots_daily (artist_id, snapshot_date desc);
create index if not exists idx_metrics_artist_date on public.derived_metrics_daily (artist_id, snapshot_date desc);
create index if not exists idx_alerts_artist_date on public.alerts (artist_id, snapshot_date desc);
create index if not exists idx_ingestion_jobs_artist_date on public.ingestion_jobs (artist_id, job_date desc);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.user_artist_links enable row level security;
alter table public.artist_snapshots_daily enable row level security;
alter table public.track_snapshots_daily enable row level security;
alter table public.derived_metrics_daily enable row level security;
alter table public.alerts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ingestion_jobs enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "user_artist_links_select_own"
  on public.user_artist_links
  for select
  using (auth.uid() = user_id);

create policy "user_artist_links_insert_own"
  on public.user_artist_links
  for insert
  with check (auth.uid() = user_id);

create policy "user_artist_links_update_own"
  on public.user_artist_links
  for update
  using (auth.uid() = user_id);

create policy "artists_select_linked"
  on public.artists
  for select
  using (
    exists (
      select 1
      from public.user_artist_links ual
      where ual.artist_id = artists.id
        and ual.user_id = auth.uid()
    )
  );

create policy "artist_snapshots_select_linked"
  on public.artist_snapshots_daily
  for select
  using (
    exists (
      select 1
      from public.user_artist_links ual
      where ual.artist_id = artist_snapshots_daily.artist_id
        and ual.user_id = auth.uid()
    )
  );

create policy "track_snapshots_select_linked"
  on public.track_snapshots_daily
  for select
  using (
    exists (
      select 1
      from public.user_artist_links ual
      where ual.artist_id = track_snapshots_daily.artist_id
        and ual.user_id = auth.uid()
    )
  );

create policy "derived_metrics_select_linked"
  on public.derived_metrics_daily
  for select
  using (
    exists (
      select 1
      from public.user_artist_links ual
      where ual.artist_id = derived_metrics_daily.artist_id
        and ual.user_id = auth.uid()
    )
  );

create policy "alerts_select_linked"
  on public.alerts
  for select
  using (
    exists (
      select 1
      from public.user_artist_links ual
      where ual.artist_id = alerts.artist_id
        and ual.user_id = auth.uid()
    )
  );

create policy "alerts_update_linked"
  on public.alerts
  for update
  using (
    exists (
      select 1
      from public.user_artist_links ual
      where ual.artist_id = alerts.artist_id
        and ual.user_id = auth.uid()
    )
  );

create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy "subscriptions_update_own"
  on public.subscriptions
  for update
  using (auth.uid() = user_id);
