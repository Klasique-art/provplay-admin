export type LivePerson = {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  account_type: string;
  status: string;
};
export type AdminLiveStream = {
  stream_id: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  broadcaster: LivePerson | null;
  match: {
    type: string;
    team_home: string;
    team_away: string;
    score_home: number;
    score_away: number;
    scorers: unknown[];
  };
  scheduled_start: string;
  started_at: string | null;
  ended_at: string | null;
  archived_at: string | null;
  duration_seconds: number;
  venue: unknown;
  country: string | null;
  access_type: string;
  is_recorded: boolean;
  allow_chat: boolean;
  broadcast_source: string;
  stream_settings: Record<string, unknown>;
  tags: string[];
  playback_id: string | null;
  playback_url: string | null;
  recording_playback_id: string | null;
  recording_url: string | null;
  recording_completed_at: string | null;
  thumbnail_url: string | null;
  health: {
    playable: boolean | null;
    mux_provisioned: boolean;
    recording_ready: boolean;
    state: string;
  };
  audience: {
    current: number;
    peak: number;
    unique: number;
    reminder_count: number;
    viewer_sessions: number;
    average_watch_seconds: number;
  };
  chat: {
    message_count: number;
    slow_mode_seconds: number;
    recent_messages: Array<{
      message_id: string;
      sender_user_id: string;
      text: string;
      created_at: string;
    }>;
  };
  reports: Array<{
    report_id: string;
    reporter_user_id: string;
    reason: string;
    details: string | null;
    status: string;
    created_at: string;
  }>;
  moderation_history: Array<{
    event_id: string;
    actor_user_id: string;
    action: string;
    reason: string | null;
    viewer_id: string | null;
    created_at: string;
  }>;
  admin_history: Array<{
    action_id: string;
    action: string;
    reason: string;
    admin_id: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
};
export type AdminLiveData = {
  generated_at: string;
  summary: {
    total: number;
    live: number;
    scheduled: number;
    ending: number;
    archived: number;
    cancelled: number;
    current_viewers: number;
    open_reports: number;
  };
  items: AdminLiveStream[];
};
