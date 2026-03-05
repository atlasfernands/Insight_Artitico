
export async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Spotify credentials not found. Using mock data.');
    return null;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function getArtistData(artistId: string) {
  const token = await getSpotifyToken();
  
  if (!token) {
    return {
      id: artistId,
      name: "Artista Exemplo",
      followers: { total: 1250000 },
      popularity: 85,
      images: [{ url: "https://picsum.photos/seed/artist/600/600" }],
      genres: ["pop", "indie"],
      external_urls: { spotify: `https://open.spotify.com/artist/${artistId}` },
      isMock: true
    };
  }

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Artista não encontrado');
  return { ...(await response.json()), isMock: false };
}

export async function getArtistTopTracks(artistId: string) {
  const token = await getSpotifyToken();
  if (!token) return [];

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=BR`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.tracks;
}

export async function getRelatedArtists(artistId: string) {
  const token = await getSpotifyToken();
  if (!token) return [];

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.artists;
}

export async function getArtistAlbums(artistId: string) {
  const token = await getSpotifyToken();
  if (!token) return [];

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10&market=BR`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.items;
}
