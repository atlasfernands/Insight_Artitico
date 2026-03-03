import { NextResponse } from "next/server";
import { z } from "zod";
import { serverRuntimeConfig } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ingestArtistDaily } from "@/lib/ingestion/service";
import { logger } from "@/lib/logger";

const BodySchema = z
  .object({
    artistId: z.string().uuid().optional(),
  })
  .optional();

function isAuthorized(request: Request) {
  const configuredSecret = serverRuntimeConfig.ingestCronSecret;
  if (!configuredSecret) {
    return false;
  }

  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const token = bearer.replace("Bearer ", "").trim();
    if (token === configuredSecret) {
      return true;
    }
  }

  const ingestSecret = request.headers.get("x-ingest-secret");
  return ingestSecret === configuredSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Não autorizado" },
      {
        status: 401,
      },
    );
  }

  const body = await request.json().catch(() => undefined);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("artists")
    .select("id,spotify_artist_id,name,spotify_url,created_at")
    .order("created_at", { ascending: true });

  if (parsed.data?.artistId) {
    query = query.eq("id", parsed.data.artistId);
  }

  const { data: artists, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.all(
    (artists ?? []).map((artist) => ingestArtistDaily({ artist })),
  );

  const summary = results.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    {
      success: 0,
      skipped: 0,
      failed: 0,
    },
  );

  logger.info({
    event: "daily_ingestion_completed",
    processed: artists?.length ?? 0,
    ...summary,
  });

  return NextResponse.json({
    processed: artists?.length ?? 0,
    summary,
    results,
  });
}
