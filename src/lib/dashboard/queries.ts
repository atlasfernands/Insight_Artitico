import type {
  AlertDTO,
  DashboardOverviewDTO,
  SubscriptionPlan,
  TrackRankingDTO,
} from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasProEntitlement } from "@/lib/auth/session";

export function parseRangeDays(rangeParam: string | null): number {
  const match = rangeParam?.match(/^(\d+)d$/i);
  const parsed = match ? Number(match[1]) : 30;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }
  return Math.min(parsed, 180);
}

async function getArtistIdByUserId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_artist_links")
    .select("artist_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.artist_id ?? null;
}

async function getPlanByUserId(userId: string): Promise<SubscriptionPlan> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (hasProEntitlement(data ?? null)) {
    return "pro";
  }
  return "free";
}

export async function loadOverviewByUserId(
  userId: string,
): Promise<DashboardOverviewDTO> {
  const plan = await getPlanByUserId(userId);
  const artistId = await getArtistIdByUserId(userId);

  if (!artistId) {
    return {
      snapshotDate: null,
      totalStreams: null,
      monthlyListeners: null,
      followers: null,
      topTrackName: null,
      weeklyGrowthPct: null,
      trendStatus: null,
      streamsPerListener: null,
      retentionIndexEst: null,
      engagementIndex: null,
      dataConfidence: null,
      plan,
      proFeaturesComingSoon: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: latestSnapshot }, { data: latestMetric }] = await Promise.all([
    supabase
      .from("artist_snapshots_daily")
      .select(
        "snapshot_date,streams_total,monthly_listeners,followers_total,top_track_name,data_confidence",
      )
      .eq("artist_id", artistId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("derived_metrics_daily")
      .select(
        "snapshot_date,weekly_growth_pct,trend_status,streams_per_listener,retention_index_est,engagement_index",
      )
      .eq("artist_id", artistId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    snapshotDate: latestSnapshot?.snapshot_date ?? null,
    totalStreams: latestSnapshot?.streams_total ?? null,
    monthlyListeners: latestSnapshot?.monthly_listeners ?? null,
    followers: latestSnapshot?.followers_total ?? null,
    topTrackName: latestSnapshot?.top_track_name ?? null,
    weeklyGrowthPct: latestMetric?.weekly_growth_pct ?? null,
    trendStatus: latestMetric?.trend_status ?? null,
    streamsPerListener: latestMetric?.streams_per_listener ?? null,
    retentionIndexEst: latestMetric?.retention_index_est ?? null,
    engagementIndex: latestMetric?.engagement_index ?? null,
    dataConfidence: latestSnapshot?.data_confidence ?? null,
    plan,
    proFeaturesComingSoon: true,
  };
}

export async function loadTracksByUserId(
  userId: string,
  rangeDays: number,
): Promise<TrackRankingDTO[]> {
  const artistId = await getArtistIdByUserId(userId);
  if (!artistId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - rangeDays);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data: latestTrackDate } = await supabase
    .from("track_snapshots_daily")
    .select("snapshot_date")
    .eq("artist_id", artistId)
    .gte("snapshot_date", sinceDate)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestTrackDate?.snapshot_date) {
    return [];
  }

  const { data } = await supabase
    .from("track_snapshots_daily")
    .select("spotify_track_id,track_name,rank_position,track_streams_estimated")
    .eq("artist_id", artistId)
    .eq("snapshot_date", latestTrackDate.snapshot_date)
    .order("rank_position", { ascending: true })
    .limit(20);

  return (data ?? []).map((item) => ({
    spotifyTrackId: item.spotify_track_id,
    trackName: item.track_name,
    rankPosition: item.rank_position,
    trackStreamsEstimated: item.track_streams_estimated,
  }));
}

export async function loadAlertsByUserId(
  userId: string,
  rangeDays: number,
): Promise<AlertDTO[]> {
  const artistId = await getArtistIdByUserId(userId);
  if (!artistId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - rangeDays);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("alerts")
    .select("id,snapshot_date,alert_type,severity,title,description,is_read")
    .eq("artist_id", artistId)
    .gte("snapshot_date", sinceDate)
    .order("snapshot_date", { ascending: false })
    .limit(50);

  return (data ?? []).map((item) => ({
    id: item.id,
    snapshotDate: item.snapshot_date,
    alertType: item.alert_type,
    severity: item.severity,
    title: item.title,
    description: item.description,
    isRead: item.is_read,
  }));
}
