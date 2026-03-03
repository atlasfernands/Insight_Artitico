import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildHybridMetrics,
  fetchOfficialArtistData,
} from "@/lib/spotify/sources";
import { buildDailyMetrics } from "@/lib/metrics/calculations";
import {
  generateBusinessAlerts,
  generateTechnicalFallbackAlert,
} from "@/lib/alerts/generator";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";
import type { IngestResult } from "@/lib/types";

type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];

interface IngestArtistInput {
  artist: ArtistRow;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sevenDaysAgo(date: Date): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - 7);
  return next;
}

function estimateTrackStreams(
  streamsTotal: number,
  topTracks: Array<{ popularity: number }>,
) {
  const weights = topTracks.map((track) => Math.max(track.popularity, 1));
  const totalWeight = weights.reduce((acc, value) => acc + value, 0) || 1;

  return weights.map((weight) => Math.max(Math.round((streamsTotal * weight) / totalWeight), 1));
}

export async function ingestArtistDaily({
  artist,
}: IngestArtistInput): Promise<IngestResult> {
  const admin = createSupabaseAdminClient();
  const startedAt = new Date();
  const jobDate = toIsoDate(startedAt);

  const { data: existingJob } = await admin
    .from("ingestion_jobs")
    .select("status")
    .eq("artist_id", artist.id)
    .eq("job_date", jobDate)
    .maybeSingle();

  if (existingJob?.status === "success") {
    return {
      artistId: artist.id,
      snapshotDate: jobDate,
      status: "skipped",
      message: "already_ingested",
    };
  }

  await admin.from("ingestion_jobs").upsert(
    {
      artist_id: artist.id,
      job_date: jobDate,
      status: "running",
      error_message: null,
      started_at: startedAt.toISOString(),
      finished_at: null,
    },
    {
      onConflict: "artist_id,job_date",
    },
  );

  try {
    const { data: historySnapshots } = await admin
      .from("artist_snapshots_daily")
      .select("snapshot_date,streams_total,monthly_listeners,top_track_name")
      .eq("artist_id", artist.id)
      .order("snapshot_date", { ascending: false })
      .limit(10);

    const lastSnapshot = historySnapshots?.[0] ?? null;
    const official = await fetchOfficialArtistData(artist.spotify_artist_id);
    if (!official) {
      throw new Error("Could not fetch official Spotify artist data");
    }

    const hybrid = await buildHybridMetrics(
      artist.spotify_artist_id,
      official.followersTotal,
      official.popularity,
    );

    let streamsTotal = hybrid.streamsTotal ?? 0;
    let monthlyListeners = hybrid.monthlyListeners ?? 0;
    let dataConfidence: "high" | "medium" | "low" =
      hybrid.source === "official+public" ? "high" : "medium";
    let source: string = hybrid.source;
    const generatedAlerts: ReturnType<typeof generateBusinessAlerts> = [];

    if (hybrid.publicSourceStatus === "failed" && lastSnapshot) {
      streamsTotal = lastSnapshot.streams_total ?? streamsTotal;
      monthlyListeners = lastSnapshot.monthly_listeners ?? monthlyListeners;
      dataConfidence = "low";
      source = "fallback_last_valid";
      generatedAlerts.push(generateTechnicalFallbackAlert());
    }

    const topTrackName = official.topTracks[0]?.name ?? lastSnapshot?.top_track_name ?? null;

    await admin.from("artist_snapshots_daily").upsert(
      {
        artist_id: artist.id,
        snapshot_date: jobDate,
        streams_total: Math.round(streamsTotal),
        monthly_listeners: Math.round(monthlyListeners),
        followers_total: official.followersTotal,
        top_track_name: topTrackName,
        data_confidence: dataConfidence,
        source,
      },
      {
        onConflict: "artist_id,snapshot_date",
      },
    );

    const topTracks = official.topTracks.slice(0, 10);
    const estimatedTrackStreams = estimateTrackStreams(streamsTotal, topTracks);

    await admin
      .from("track_snapshots_daily")
      .delete()
      .eq("artist_id", artist.id)
      .eq("snapshot_date", jobDate);

    if (topTracks.length > 0) {
      await admin.from("track_snapshots_daily").insert(
        topTracks.map((track, index) => ({
          artist_id: artist.id,
          snapshot_date: jobDate,
          spotify_track_id: track.id,
          track_name: track.name,
          track_streams_estimated: estimatedTrackStreams[index],
          rank_position: index + 1,
        })),
      );
    }

    const exact7DaysAgo = toIsoDate(sevenDaysAgo(startedAt));
    const streams7dAgo =
      historySnapshots?.find((snapshot) => snapshot.snapshot_date === exact7DaysAgo)
        ?.streams_total ??
      historySnapshots?.[Math.min(6, (historySnapshots?.length ?? 1) - 1)]?.streams_total ??
      streamsTotal;

    const trendSeries = [
      ...(historySnapshots ?? [])
        .slice(0, 6)
        .reverse()
        .map((snapshot) => snapshot.streams_total ?? streamsTotal),
      streamsTotal,
    ];

    const metrics = buildDailyMetrics({
      streamsTotal,
      monthlyListeners,
      followersTotal: official.followersTotal,
      streams7dAgo,
      trendSeries,
    });

    await admin.from("derived_metrics_daily").upsert(
      {
        artist_id: artist.id,
        snapshot_date: jobDate,
        streams_per_listener: metrics.streamsPerListener,
        retention_index_est: metrics.retentionIndexEst,
        engagement_index: metrics.engagementIndex,
        trend_status: metrics.trendStatus,
        weekly_growth_pct: metrics.weeklyGrowthPct,
      },
      {
        onConflict: "artist_id,snapshot_date",
      },
    );

    generatedAlerts.push(...generateBusinessAlerts(metrics));

    await admin
      .from("alerts")
      .delete()
      .eq("artist_id", artist.id)
      .eq("snapshot_date", jobDate);

    if (generatedAlerts.length > 0) {
      await admin.from("alerts").insert(
        generatedAlerts.map((alert) => ({
          artist_id: artist.id,
          snapshot_date: jobDate,
          alert_type: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
        })),
      );
    }

    await admin
      .from("ingestion_jobs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
      })
      .eq("artist_id", artist.id)
      .eq("job_date", jobDate);

    logger.info({
      event: "ingestion_success",
      artist_id: artist.id,
      snapshot_date: jobDate,
      source_status: hybrid.publicSourceStatus,
    });

    return {
      artistId: artist.id,
      snapshotDate: jobDate,
      status: "success",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_ingestion_error";
    await admin
      .from("ingestion_jobs")
      .update({
        status: "failed",
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq("artist_id", artist.id)
      .eq("job_date", jobDate);

    logger.error({
      event: "ingestion_failed",
      artist_id: artist.id,
      snapshot_date: jobDate,
      error: message,
    });

    return {
      artistId: artist.id,
      snapshotDate: jobDate,
      status: "failed",
      message,
    };
  }
}
