// Manual ingestion script: fetches artist from Spotify and inserts into Supabase
// Usage (after filling .env.local and exporting env vars):
// SPOTIFY_TOKEN="Bearer ..." node --loader ts-node/esm scripts/ingest-spotify.ts <spotifyArtistId>

import process from 'process';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPOTIFY_TOKEN = process.env.SPOTIFY_TOKEN; // e.g. "Bearer <token>"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env variables. Fill .env.local and export them.');
  process.exit(1);
}

if (!SPOTIFY_TOKEN) {
  console.error('Missing SPOTIFY_TOKEN. Get a token via client credentials or developer console.');
  process.exit(1);
}

const artistId = process.argv[2];
if (!artistId) {
  console.error('Usage: node scripts/ingest-spotify.ts <spotifyArtistId>');
  process.exit(1);
}

async function fetchSpotifyArtist(id: string) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: SPOTIFY_TOKEN },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function upsertArtistToSupabase(artist: any) {
  const payload = {
    spotify_artist_id: artist.id,
    name: artist.name,
    spotify_url: artist.external_urls?.spotify || null,
    image_url: (artist.images && artist.images[0]?.url) || null,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/artists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (![200,201].includes(res.status)) {
    const txt = await res.text();
    throw new Error(`Supabase insert artist error: ${res.status} ${txt}`);
  }
  const rows = await res.json();
  return rows[0];
}

async function insertMetric(artist_db_id: string, followers?: number) {
  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    artist_id: artist_db_id,
    date: today,
    followers: followers ?? null,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/artist_daily_metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (![200,201].includes(res.status)) {
    const txt = await res.text();
    throw new Error(`Supabase insert metric error: ${res.status} ${txt}`);
  }
  return res.json();
}

async function main() {
  try {
    console.log('Fetching artist from Spotify:', artistId);
    const artist = await fetchSpotifyArtist(artistId);
    console.log('Upserting artist to Supabase...');
    const row = await upsertArtistToSupabase(artist);
    const artist_db_id = row.id;
    console.log('Inserted/updated artist id:', artist_db_id);
    console.log('Inserting metric snapshot...');
    const followers = artist.followers?.total ?? null;
    const metric = await insertMetric(artist_db_id, followers);
    console.log('Metric inserted:', metric);
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
