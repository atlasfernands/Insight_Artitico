// Calculate derived metrics from daily snapshots (v1: simple baseline)
import { supabaseAdmin } from './supabaseAdmin';

export async function calculateMetricsForArtist(artistDbId: string, snapshotDate: string) {
  // Fetch current snapshot
  const { data: currentSnapshot, error: currentError } = await supabaseAdmin
    .from('artist_daily_metrics')
    .select('*')
    .eq('artist_id', artistDbId)
    .eq('date', snapshotDate)
    .single();

  if (currentError) {
    console.error(`[Metrics] Could not fetch current snapshot: ${currentError.message}`);
    return;
  }

  // Fetch previous day's snapshot for comparison
  const previousDate = new Date(snapshotDate);
  previousDate.setDate(previousDate.getDate() - 1);
  const previousDateStr = previousDate.toISOString().split('T')[0];

  const { data: previousSnapshot } = await supabaseAdmin
    .from('artist_daily_metrics')
    .select('followers')
    .eq('artist_id', artistDbId)
    .eq('date', previousDateStr)
    .single();

  // Simple v1 metrics
  const followers = currentSnapshot.followers || 0;
  const previousFollowers = previousSnapshot?.followers || followers;
  const followerDelta = followers - previousFollowers;
  const followerGrowthPct = previousFollowers > 0 ? (followerDelta / previousFollowers) * 100 : 0;

  // Determine trend
  let trendStatus = 'stable';
  if (followerGrowthPct > 0.5) trendStatus = 'up';
  if (followerGrowthPct < -0.5) trendStatus = 'down';

  // Engagement (placeholder: 0-100 based on popularity)
  const engagementIndex = Math.random() * 100; // TODO: calculate from real data

  // Update snapshot with calculated metrics
  const { error: updateError } = await supabaseAdmin
    .from('artist_daily_metrics')
    .update({
      trend_status: trendStatus,
      engagement_rate: Math.round(engagementIndex * 100) / 100,
      retention_index: Math.max(0, Math.min(100, 50 + followerGrowthPct)), // Baseline + growth
    })
    .eq('artist_id', artistDbId)
    .eq('date', snapshotDate);

  if (updateError) {
    console.error(`[Metrics] Failed to update metrics: ${updateError.message}`);
  } else {
    console.log(`[Metrics] ✓ Updated for ${artistDbId} on ${snapshotDate}: trend=${trendStatus}`);
  }
}
