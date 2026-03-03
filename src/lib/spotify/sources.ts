import "server-only";

import { serverRuntimeConfig } from "@/lib/env";
import { logger } from "@/lib/logger";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtistResponse {
  id: string;
  name: string;
  popularity: number;
  followers: { total: number };
}

interface SpotifyTopTracksResponse {
  tracks: Array<{
    id: string;
    name: string;
    popularity: number;
  }>;
}

interface PublicMetricsResponse {
  monthlyListeners: number | null;
  streamsTotal: number | null;
}

export interface OfficialArtistData {
  spotifyArtistId: string;
  name: string;
  followersTotal: number;
  popularity: number;
  topTracks: Array<{
    id: string;
    name: string;
    popularity: number;
  }>;
}

export interface HybridArtistMetrics {
  monthlyListeners: number | null;
  streamsTotal: number | null;
  source: "official+public" | "official+estimated";
  publicSourceStatus: "ok" | "missing" | "failed";
}

let spotifyTokenCache:
  | {
      token: string;
      expiresAt: number;
    }
  | undefined;

async function getSpotifyAccessToken() {
  const now = Date.now();
  if (spotifyTokenCache && spotifyTokenCache.expiresAt > now + 30_000) {
    return spotifyTokenCache.token;
  }

  const clientId = serverRuntimeConfig.spotifyClientId;
  const clientSecret = serverRuntimeConfig.spotifyClientSecret;
  if (!clientId || !clientSecret) {
    return null;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    logger.warn({
      event: "spotify_token_fetch_failed",
      status: tokenResponse.status,
    });
    return null;
  }

  const payload = (await tokenResponse.json()) as SpotifyTokenResponse;
  spotifyTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return payload.access_token;
}

export async function fetchOfficialArtistData(
  spotifyArtistId: string,
): Promise<OfficialArtistData | null> {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return null;
  }

  const [artistRes, topTracksRes] = await Promise.all([
    fetch(`https://api.spotify.com/v1/artists/${spotifyArtistId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(
      `https://api.spotify.com/v1/artists/${spotifyArtistId}/top-tracks?market=BR`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    ),
  ]);

  if (!artistRes.ok || !topTracksRes.ok) {
    logger.warn({
      event: "spotify_artist_fetch_failed",
      spotifyArtistId,
      artistStatus: artistRes.status,
      topTracksStatus: topTracksRes.status,
    });
    return null;
  }

  const artist = (await artistRes.json()) as SpotifyArtistResponse;
  const topTracks = (await topTracksRes.json()) as SpotifyTopTracksResponse;

  return {
    spotifyArtistId: artist.id,
    name: artist.name,
    followersTotal: artist.followers.total,
    popularity: artist.popularity,
    topTracks: topTracks.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      popularity: track.popularity,
    })),
  };
}

async function fetchPublicMetrics(spotifyArtistId: string): Promise<{
  status: "ok" | "missing" | "failed";
  payload: PublicMetricsResponse | null;
}> {
  const baseUrl = serverRuntimeConfig.publicMetricsEndpoint;
  if (!baseUrl) {
    return { status: "missing", payload: null };
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/artists/${spotifyArtistId}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      logger.warn({
        event: "public_metrics_fetch_failed",
        spotifyArtistId,
        status: response.status,
      });
      return { status: "failed", payload: null };
    }

    const payload = (await response.json()) as PublicMetricsResponse;
    return {
      status: "ok",
      payload: {
        monthlyListeners: payload.monthlyListeners ?? null,
        streamsTotal: payload.streamsTotal ?? null,
      },
    };
  } catch (error) {
    logger.warn({
      event: "public_metrics_request_error",
      spotifyArtistId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return { status: "failed", payload: null };
  }
}

function estimateMonthlyListeners(followers: number, popularity: number): number {
  return Math.max(Math.round(followers * 1.8 + popularity * 1000), 1);
}

function estimateStreamsTotal(monthlyListeners: number, popularity: number): number {
  const multiplier = 2 + popularity / 100;
  return Math.max(Math.round(monthlyListeners * multiplier), 1);
}

export async function buildHybridMetrics(
  spotifyArtistId: string,
  followersTotal: number,
  popularity: number,
): Promise<HybridArtistMetrics> {
  const publicMetricsOutcome = await fetchPublicMetrics(spotifyArtistId);
  const publicMetrics = publicMetricsOutcome.payload;

  if (
    publicMetrics &&
    publicMetrics.monthlyListeners !== null &&
    publicMetrics.streamsTotal !== null
  ) {
    return {
      monthlyListeners: publicMetrics.monthlyListeners,
      streamsTotal: publicMetrics.streamsTotal,
      source: "official+public",
      publicSourceStatus: publicMetricsOutcome.status,
    };
  }

  const estimatedMonthlyListeners =
    publicMetrics?.monthlyListeners ??
    estimateMonthlyListeners(followersTotal, popularity);
  const estimatedStreamsTotal =
    publicMetrics?.streamsTotal ??
    estimateStreamsTotal(estimatedMonthlyListeners, popularity);

  return {
    monthlyListeners: estimatedMonthlyListeners,
    streamsTotal: estimatedStreamsTotal,
    source: "official+estimated",
    publicSourceStatus: publicMetricsOutcome.status,
  };
}
