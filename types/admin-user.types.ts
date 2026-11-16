export type AccountType = "player" | "coach" | "scout" | "agent" | "club" | "academy";
export type AccountStatus = "active" | "deactivated" | "pending_deletion" | "suspended";
export type SubscriptionPlan = "free" | "premium" | "pro" | "max";

export type AdminUserListItem = {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  account_type: AccountType;
  country?: string | null;
  city?: string | null;
  status: AccountStatus;
  onboarding_completed: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  professionally_verified: boolean;
  pending_verification: boolean;
  profile_visibility?: string | null;
  subscription_plan: SubscriptionPlan;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUserListResponse = {
  items: AdminUserListItem[];
  total_count: number;
  counts: {
    by_account_type: Record<AccountType, number>;
    by_status: Record<AccountStatus, number>;
  };
  next_cursor: string | null;
};

export type AdminUserDetail = {
  account: AdminUserListItem & {
    phone?: string | null;
    date_of_birth?: string | null;
    deactivated_at?: string | null;
    scheduled_deletion_at?: string | null;
    deletion_reason?: string | null;
  };
  profile: null | {
    cover_url?: string | null;
    city?: string | null;
    bio?: string | null;
    visibility?: string;
    last_seen_at?: string | null;
    counters?: Record<string, number>;
    role_summary?: Record<string, string | null>;
  };
  subscriptions: Array<{ subscription_id: string; plan_id: string; status: string; billing_period: string; platform: string; provider: string; current_period_ends_at?: string | null; renews_at?: string | null; cancel_at_period_end?: boolean }>;
  moderation: { reports_involving_account: number; active_sessions: number; latest_verification: null | { application_id: string; status: string; submitted_at: string } };
  activity: { highlights: number; trial_applications: number };
};

export type ApiEnvelope<T> = { success: true; data: T; meta: { request_id: string; timestamp: string } };
