import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  normalizeSpotifyArtistId,
  toSpotifyArtistUrl,
} from "@/lib/spotify/parse";
import { fetchOfficialArtistData } from "@/lib/spotify/sources";

const BodySchema = z.object({
  spotifyInput: z.string().min(3),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.json(
      { error: "Não autenticado" },
      {
        status: 401,
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corpo inválido" },
      {
        status: 400,
      },
    );
  }

  const normalizedSpotifyArtistId = normalizeSpotifyArtistId(parsed.data.spotifyInput);
  if (!normalizedSpotifyArtistId) {
    return NextResponse.json(
      { error: "URL/ID do Spotify inválido" },
      {
        status: 400,
      },
    );
  }

  const official = await fetchOfficialArtistData(normalizedSpotifyArtistId);
  const admin = createSupabaseAdminClient();

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      locale: "pt-BR",
    },
    {
      onConflict: "id",
    },
  );
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const artistName = official?.name ?? `Artista ${normalizedSpotifyArtistId.slice(0, 6)}`;
  const spotifyUrl = toSpotifyArtistUrl(normalizedSpotifyArtistId);

  const { data: artist, error: artistError } = await admin
    .from("artists")
    .upsert(
      {
        spotify_artist_id: normalizedSpotifyArtistId,
        name: artistName,
        spotify_url: spotifyUrl,
      },
      {
        onConflict: "spotify_artist_id",
      },
    )
    .select("id,spotify_artist_id")
    .single();

  if (artistError || !artist) {
    return NextResponse.json(
      { error: artistError?.message ?? "Não foi possível salvar o artista" },
      { status: 500 },
    );
  }

  const { error: linkError } = await admin.from("user_artist_links").upsert(
    {
      user_id: user.id,
      artist_id: artist.id,
    },
    {
      onConflict: "user_id",
    },
  );

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan: "free",
      status: "inactive",
    },
    {
      onConflict: "user_id",
    },
  );

  return NextResponse.json({
    artistId: artist.id,
    normalizedSpotifyArtistId: artist.spotify_artist_id,
  });
}
