-- Initial schema: artists + daily metrics
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  spotify_artist_id text unique not null,
  name text not null,
  spotify_url text not null,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists artist_daily_metrics (
  id bigserial primary key,
  artist_id uuid references artists(id) on delete cascade,
  date date not null,
  followers integer,
  monthly_listeners integer,
  total_streams_estimate bigint,
  engagement_rate numeric(5,2),
  retention_index integer,
  trend_status text,
  created_at timestamptz default now(),
  unique (artist_id, date)
);

create index if not exists idx_artist_metrics_lookup
on artist_daily_metrics (artist_id, date desc);
