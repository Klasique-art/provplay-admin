export type EngagementAnalytics = {
  generated_at: string;
  period: { days: 7 | 30 | 90; starts_at: string; ends_at: string };
  summary: {
    active_users: number;
    active_users_change_percent: number | null;
    returning_users: number;
    returning_user_percent: number;
    total_events: number;
    events_change_percent: number | null;
    events_per_active_user: number;
    measured_sessions: number;
    average_session_seconds: number;
    total_engaged_seconds: number;
  };
  series: Array<{ date: string; active_users: number; events: number; sessions: number }>;
  feature_adoption: Array<{ feature: string; active_users: number; adoption_percent: number }>;
  content_engagement: {
    video_starts: number;
    video_completions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  top_events: Array<{ event: string; count: number }>;
  platforms: Array<{ platform: string; active_users: number }>;
  hourly_activity_utc: Array<{ hour: number; events: number }>;
  methodology: Record<string, string>;
};
