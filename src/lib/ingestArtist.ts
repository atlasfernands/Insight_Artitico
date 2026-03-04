// Artist ingestion service: fetch → normalize → save → snapshot
import { fetchSpotifyArtist, fetchSpotifyTopTracks } from './spotifyClient';
import { supabaseAdmin } from './supabaseAdmin';

export interface ArtistIngestResult {
  artistId: string; // DB UUID
  artistName: string;
  spotifyId: string;
  snapshotId: string;
  snapshotDate: string;
  followers: number;
  popularity: number;
}

export async function ingestArtist(spotifyArtistId: string): Promise<ArtistIngestResult> {
  // 1. Fetch from Spotify
  console.log(`[Ingest] Fetching artist ${spotifyArtistId} from Spotify...`);
  const spotifyData = await fetchSpotifyArtist(spotifyArtistId);

  // 2. Upsert artist record
  console.log(`[Ingest] Upserting artist "${spotifyData.name}"...`);
  const { data: artistRows, error: artistError } = await supabaseAdmin
    .from('artists')
    .upsert(
      {
        spotify_artist_id: spotifyData.id,
        name: spotifyData.name,
        spotify_url: spotifyData.external_urls.spotify,
        image_url: spotifyData.images?.[0]?.url || null,
      },
      { onConflict: 'spotify_artist_id' }
    )
    .select();

  if (artistError) throw new Error(`Failed to upsert artist: ${artistError.message}`);
  if (!artistRows || artistRows.length === 0) {
    throw new Error('Artist upsert returned no rows');
  }

  const artist = artistRows[0];
  const artistDbId = artist.id;

  // 3. Create daily snapshot
  console.log(`[Ingest] Creating snapshot for artist ${artistDbId}...`);
  const today = new Date().toISOString().split('T')[0];

  const { data: snapshotRows, error: snapshotError } = await supabaseAdmin
    .from('artist_daily_metrics')
    .upsert(
      {
        artist_id: artistDbId,
        date: today,
        followers: spotifyData.followers.total,
        monthly_listeners: null, // Not available from public API
        total_streams_estimate: null,
        engagement_rate: null,
        retention_index: null,
        trend_status: null,
      },
      { onConflict: 'artist_id,date' }
    )
    .select();

  if (snapshotError) throw new Error(`Failed to create snapshot: ${snapshotError.message}`);
  if (!snapshotRows || snapshotRows.length === 0) {
    throw new Error('Snapshot creation returned no rows');
  }

  const snapshot = snapshotRows[0];

  console.log(`[Ingest] ✓ Success: artist=${artist.name}, followers=${spotifyData.followers.total}`);

  return {
    artistId: artistDbId,
    artistName: artist.name,
    spotifyId: spotifyArtistId,
    snapshotId: snapshot.id.toString(),
    snapshotDate: today,
    followers: spotifyData.followers.total,
    popularity: spotifyData.popularity,
  };
}
