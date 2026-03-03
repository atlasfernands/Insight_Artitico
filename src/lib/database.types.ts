export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          locale: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          locale?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          locale?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      artists: {
        Row: {
          id: string;
          spotify_artist_id: string;
          name: string;
          spotify_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          spotify_artist_id: string;
          name: string;
          spotify_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          spotify_artist_id?: string;
          name?: string;
          spotify_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_artist_links: {
        Row: {
          user_id: string;
          artist_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          artist_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          artist_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      artist_snapshots_daily: {
        Row: {
          id: string;
          artist_id: string;
          snapshot_date: string;
          streams_total: number | null;
          monthly_listeners: number | null;
          followers_total: number | null;
          top_track_name: string | null;
          data_confidence: "high" | "medium" | "low";
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          snapshot_date: string;
          streams_total?: number | null;
          monthly_listeners?: number | null;
          followers_total?: number | null;
          top_track_name?: string | null;
          data_confidence: "high" | "medium" | "low";
          source: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          snapshot_date?: string;
          streams_total?: number | null;
          monthly_listeners?: number | null;
          followers_total?: number | null;
          top_track_name?: string | null;
          data_confidence?: "high" | "medium" | "low";
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      track_snapshots_daily: {
        Row: {
          id: string;
          artist_id: string;
          snapshot_date: string;
          spotify_track_id: string;
          track_name: string;
          track_streams_estimated: number;
          rank_position: number;
        };
        Insert: {
          id?: string;
          artist_id: string;
          snapshot_date: string;
          spotify_track_id: string;
          track_name: string;
          track_streams_estimated: number;
          rank_position: number;
        };
        Update: {
          id?: string;
          artist_id?: string;
          snapshot_date?: string;
          spotify_track_id?: string;
          track_name?: string;
          track_streams_estimated?: number;
          rank_position?: number;
        };
        Relationships: [];
      };
      derived_metrics_daily: {
        Row: {
          id: string;
          artist_id: string;
          snapshot_date: string;
          streams_per_listener: number;
          retention_index_est: number;
          engagement_index: number;
          trend_status: "up" | "stable" | "down";
          weekly_growth_pct: number;
        };
        Insert: {
          id?: string;
          artist_id: string;
          snapshot_date: string;
          streams_per_listener: number;
          retention_index_est: number;
          engagement_index: number;
          trend_status: "up" | "stable" | "down";
          weekly_growth_pct: number;
        };
        Update: {
          id?: string;
          artist_id?: string;
          snapshot_date?: string;
          streams_per_listener?: number;
          retention_index_est?: number;
          engagement_index?: number;
          trend_status?: "up" | "stable" | "down";
          weekly_growth_pct?: number;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          artist_id: string;
          snapshot_date: string;
          alert_type: string;
          severity: "info" | "warning" | "critical";
          title: string;
          description: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          snapshot_date: string;
          alert_type: string;
          severity: "info" | "warning" | "critical";
          title: string;
          description: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          snapshot_date?: string;
          alert_type?: string;
          severity?: "info" | "warning" | "critical";
          title?: string;
          description?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "free" | "pro";
          status: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "pro";
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "pro";
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ingestion_jobs: {
        Row: {
          id: string;
          artist_id: string;
          job_date: string;
          status: "running" | "success" | "failed";
          error_message: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          artist_id: string;
          job_date: string;
          status?: "running" | "success" | "failed";
          error_message?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          artist_id?: string;
          job_date?: string;
          status?: "running" | "success" | "failed";
          error_message?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
