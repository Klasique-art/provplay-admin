export type AiRatingItem = {
  highlight_id: string;
  caption: string | null;
  owner: {
    user_id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    account_type: string;
    status: string;
  } | null;
  media: Record<string, unknown>;
  thumbnail_url: string | null;
  status: string;
  overall: number | null;
  metrics: Record<string, unknown> | null;
  confidence: number | null;
  analysis_version: string | null;
  retry_count: number;
  requested_at: string;
  completed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  attempts: Array<{
    history_id: string;
    status: string;
    attempt: number;
    analysis_version: string | null;
    overall: number | null;
    error_code: string | null;
    error_message: string | null;
    queued_at: string;
    started_at: string | null;
    completed_at: string | null;
  }>;
};
export type AiRatingData = {
  generated_at: string;
  summary: {
    total: number;
    processing: number;
    ready: number;
    failed: number;
    cancelled: number;
    success_rate: number;
    average_score: number | null;
  };
  versions: Array<{
    version: string;
    requests: number;
    ready: number;
    failed: number;
  }>;
  capabilities: { formal_appeals: boolean; retry_limit: number };
  items: AiRatingItem[];
};
