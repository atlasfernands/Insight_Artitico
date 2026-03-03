// Manual ingestion script: fetches artist from Spotify and inserts into Supabase.
// It loads `.env.local` automatically and will request a Spotify access token via
// the client credentials flow if `SPOTIFY_TOKEN` isn't provided.
//
// .env.local must include at least:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SPOTIFY_CLIENT_ID (for token flow)
//   SPOTIFY_CLIENT_SECRET (for token flow)
//
// Usage (after installing deps):
//   npm run ingest -- <spotifyArtistId>
//   npm run ingest -- artist1 artist2  # you can pass multiple ids

import process from 'process';
import fs from 'fs';

// load environment variables from .env.local if present
if (fs.existsSync('.env.local')) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env variables. Fill .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

async function getSpotifyToken(): Promise<string> {
  if (process.env.SPOTIFY_TOKEN) {
    return process.env.SPOTIFY_TOKEN;
  }
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('Spotify credentials missing: set SPOTIFY_TOKEN or SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in env');
  }
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error(`Failed to fetch Spotify token: ${resp.status}`);
  const data = await resp.json();
  return `Bearer ${data.access_token}`;
}

const artistIds = process.argv.slice(2);
if (artistIds.length === 0) {
  console.error('Usage: npm run ingest -- <spotifyArtistId> [moreIds...]');
  process.exit(1);
}

async function fetchSpotifyArtist(id: string, token: string) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: token },
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
    const token = await getSpotifyToken();
    for (const id of artistIds) {
      console.log('Fetching artist from Spotify:', id);
      const artist = await fetchSpotifyArtist(id, token);
      console.log('Upserting artist to Supabase...');
      const row = await upsertArtistToSupabase(artist);
      const artist_db_id = row.id;
      console.log('Inserted/updated artist id:', artist_db_id);
      console.log('Inserting metric snapshot...');
      const followers = artist.followers?.total ?? null;
      const metric = await insertMetric(artist_db_id, followers);
      console.log('Metric inserted:', metric);
    }
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
