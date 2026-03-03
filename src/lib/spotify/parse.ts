const ARTIST_ID_REGEX = /^[0-9A-Za-z]{22}$/;

export function normalizeSpotifyArtistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (ARTIST_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const artistSegment = segments.findIndex((segment) => segment === "artist");
    if (artistSegment >= 0 && segments[artistSegment + 1]) {
      const candidate = segments[artistSegment + 1].split("?")[0];
      return ARTIST_ID_REGEX.test(candidate) ? candidate : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function toSpotifyArtistUrl(spotifyArtistId: string): string {
  return `https://open.spotify.com/artist/${spotifyArtistId}`;
}
