export type TrendStatus = "up" | "stable" | "down";
export type SubscriptionPlan = "free" | "pro";
export type DataConfidence = "high" | "medium" | "low";

export interface ArtistSnapshotRaw {
  spotifyArtistId: string;
  artistName: string;
  spotifyUrl: string;
  followersTotal: number | null;
  monthlyListeners: number | null;
  streamsTotal: number | null;
  topTrackName: string | null;
  source: "official+public" | "official+estimated" | "fallback_last_valid";
  dataConfidence: DataConfidence;
}

export interface DailyMetrics {
  streamsPerListener: number;
  retentionIndexEst: number;
  engagementIndex: number;
  trendStatus: TrendStatus;
  weeklyGrowthPct: number;
}

export interface DashboardOverviewDTO {
  snapshotDate: string | null;
  totalStreams: number | null;
  monthlyListeners: number | null;
  followers: number | null;
  topTrackName: string | null;
  weeklyGrowthPct: number | null;
  trendStatus: TrendStatus | null;
  streamsPerListener: number | null;
  retentionIndexEst: number | null;
  engagementIndex: number | null;
  dataConfidence: DataConfidence | null;
  plan: SubscriptionPlan;
  proFeaturesComingSoon: boolean;
}

export interface TrackRankingDTO {
  spotifyTrackId: string;
  trackName: string;
  rankPosition: number;
  trackStreamsEstimated: number;
}

export interface AlertDTO {
  id: string;
  snapshotDate: string;
  alertType: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  isRead: boolean;
}

export interface IngestResult {
  artistId: string;
  snapshotDate: string;
  status: "success" | "skipped" | "failed";
  message?: string;
}
