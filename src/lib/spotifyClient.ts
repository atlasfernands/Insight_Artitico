// Spotify Client using Client Credentials flow (no user OAuth needed)
// Fetches public artist data from Spotify Web API

interface SpotifyArtistData {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images: Array<{ url: string }>;
  followers: { total: number };
  popularity: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyAccessToken(): Promise<string> {
  // Check cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Spotify credentials. Fill SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local'
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify auth failed: ${response.status} ${text}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Refresh 60s before expiry
  };

  return cachedToken.token;
}

export async function fetchSpotifyArtist(artistId: string): Promise<SpotifyArtistData> {
  const token = await getSpotifyAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${text}`);
  }

  return response.json() as Promise<SpotifyArtistData>;
}

export async function fetchSpotifyTopTracks(artistId: string, limit = 10) {
  const token = await getSpotifyAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify top tracks error: ${response.status} ${text}`);
  }

  return response.json() as Promise<{ tracks: Array<{ id: string; name: string; popularity: number }> }>;
}
