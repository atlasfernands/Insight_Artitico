// Manual ingestion script using the ingestion pipeline services
// Usage: npm run ingest -- <spotifyArtistId>
// Example: npm run ingest -- 1vCWHaC5f2uS3yhpwWbIA6

import process from 'process';
import fs from 'fs';

// Load .env.local
if (fs.existsSync('.env.local')) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
}

// Import services
import { ingestArtist } from '../src/lib/ingestArtist.js';
import { calculateMetricsForArtist } from '../src/lib/calculateMetrics.js';

const artistIds = process.argv.slice(2);

if (artistIds.length === 0) {
  console.error('Usage: npm run ingest -- <spotifyArtistId> [moreIds...]');
  console.error('Example: npm run ingest -- 1vCWHaC5f2uS3yhpwWbIA6');
  process.exit(1);
}

async function processArtist(spotifyId: string) {
  try {
    console.log(`\n🎵 Ingesting artist: ${spotifyId}`);
    const result = await ingestArtist(spotifyId);

    console.log(`✅ Success: ${result.artistName} (${result.followers} followers)`);

    console.log(`📊 Calculating metrics...`);
    await calculateMetricsForArtist(result.artistId, result.snapshotDate);

    return true;
  } catch (err) {
    console.error(`❌ Failed: ${err}`);
    return false;
  }
}

async function main() {
  console.log(`\n🚀 Ingestion Pipeline v1\n`);
  console.log(`Artists to ingest: ${artistIds.join(', ')}\n`);

  const results = await Promise.all(artistIds.map(id => processArtist(id)));
  const succeeded = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n\n📈 Summary: ${succeeded}/${total} artists processed\n`);

  if (succeeded < total) {
    process.exit(1);
  }
}

main();
