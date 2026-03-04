#!/usr/bin/env ts-node
// Ingestion script v1: pipeline with mock fallback for non-Premium Spotify
// Usage: npm run ingest -- <spotifyArtistId>
// With mock: INGEST_MOCK=true npm run ingest -- 1Xyo4u8uQ69FIPECSLoU

import process from 'process';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local 
function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

// ============================================================
// Mock Spotify Service
// ============================================================
function createMockArtist(spotifyId: string) {
  const mockDb: Record<string, any> = {
    '1Xyo4u8uQ69FIPECSLoU': {
      id: '1Xyo4u8uQ69FIPECSLoU',
      name: 'The Weeknd',
      external_urls: { spotify: 'https://open.spotify.com/artist/1Xyo4u8uQ69FIPECSLoU' },
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb4f6f1886b7c26457d594f63f' }],
      followers: { total: 85000000 },
      popularity: 95,
    },
    '3TVXtAsR1Inkt0c92BV9KN': {
      id: '3TVXtAsR1Inkt0c92BV9KN',
      name: 'Drake',
      external_urls: { spotify: 'https://open.spotify.com/artist/3TVXtAsR1Inkt0c92BV9KN' },
      images: [{ url: 'https://i.scdn.co/image/ab67616100005174e7335187178b0d72334b2e2a' }],
      followers: { total: 73000000 },
      popularity: 92,
    },
    '6vWucJ96N7WDfb3qM8uD1b': {
      id: '6vWucJ96N7WDfb3qM8uD1b',
      name: 'Billie Eilish',
      external_urls: { spotify: 'https://open.spotify.com/artist/6vWucJ96N7WDfb3qM8uD1b' },
      images: [{ url: 'https://i.scdn.co/image/ab67616100005174c87c2f41f20f6ca0bfe7659e' }],
      followers: { total: 120000000 },
      popularity: 94,
    },
  };
  return mockDb[spotifyId] || {
    id: spotifyId,
    name: `Test Artist ${spotifyId.substring(0, 8)}`,
    external_urls: { spotify: `https://open.spotify.com/artist/${spotifyId}` },
    images: [{ url: 'https://via.placeholder.com/300' }],
    followers: { total: Math.floor(Math.random() * 50000000) + 10000000 },
    popularity: Math.floor(Math.random() * 100),
  };
}

// ============================================================
// Spotify Client (with Mock fallback)
// ============================================================
const USE_MOCK = process.env.INGEST_MOCK === 'true';

async function getSpotifyToken(): Promise<string> {
  if (USE_MOCK) return 'mock-token';

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET. Use INGEST_MOCK=true to test.');
  }

  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Spotify auth failed: ${resp.status} ${text}. Use INGEST_MOCK=true to skip premium checks.`);
  }

  const { access_token } = await resp.json() as { access_token: string };
  return access_token;
}

async function fetchSpotifyArtist(spotifyId: string): Promise<any> {
  if (USE_MOCK) {
    return createMockArtist(spotifyId);
  }

  const token = await getSpotifyToken();
  const resp = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Spotify fetch: ${resp.status} ${text}`);
  }

  return resp.json();
}

// ============================================================
// Supabase Admin Client
// ============================================================
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!sbUrl || !sbKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const sb = createClient(sbUrl, sbKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// Ingestion Service
// ============================================================
async function ingestArtist(spotifyId: string) {
  console.log(`\n[Ingest] ${spotifyId}...`);

  // Fetch from Spotify (or mock)
  const artist = await fetchSpotifyArtist(spotifyId);
  console.log(`[Ingest] Saving ${artist.name} (${artist.followers.total.toLocaleString()} followers)...`);

  // Upsert artist
  const { data: artists, error: err1 } = await sb
    .from('artists')
    .upsert(
      {
        spotify_artist_id: artist.id,
        name: artist.name,
        spotify_url: artist.external_urls.spotify,
        image_url: artist.images?.[0]?.url || null,
      },
      { onConflict: 'spotify_artist_id' }
    )
    .select();

  if (err1) throw new Error(`Upsert artist failed: ${err1.message}`);
  if (!artists?.length) throw new Error('No artist returned from upsert');

  const dbArtist = artists[0];
  const today = new Date().toISOString().split('T')[0];

  // Create daily snapshot
  const { data: metrics, error: err2 } = await sb
    .from('artist_daily_metrics')
    .upsert(
      {
        artist_id: dbArtist.id,
        date: today,
        followers: artist.followers.total,
        engagement_rate: null,
        retention_index: null,
        trend_status: null,
      },
      { onConflict: 'artist_id,date' }
    )
    .select();

  if (err2) throw new Error(`Create metric failed: ${err2.message}`);
  if (!metrics?.length) throw new Error('No metric returned from upsert');

  console.log(`✅ Success: ${dbArtist.name} on ${today}`);
  return { id: dbArtist.id, name: dbArtist.name, date: today };
}

// ============================================================
// Main
// ============================================================
const ids = process.argv.slice(2);

if (!ids.length) {
  console.error('\n❌ Usage: npm run ingest -- <spotifyArtistId>\n');
  console.error('Examples:');
  console.error('  npm run ingest -- 1Xyo4u8uQ69FIPECSLoU (needs Premium)');
  console.error('  INGEST_MOCK=true npm run ingest -- 1Xyo4u8uQ69FIPECSLoU (uses mock data)\n');
  process.exit(1);
}

async function main() {
  console.log(`\n🚀 Ingestion Pipeline v1 ${USE_MOCK ? '[MOCK MODE]' : '[LIVE MODE]'}\n`);

  for (const id of ids) {
    try {
      await ingestArtist(id);
    } catch (e) {
      console.error(`❌ Failed: ${e}`);
    }
  }

  console.log('\n✨ Done\n');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
