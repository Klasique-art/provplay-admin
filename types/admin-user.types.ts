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
    referral_code: string;
    referred_by_user_id?: string | null;
    account_type_switch_count: number;
    last_account_type_switch_at?: string | null;
    password_changed_at?: string | null;
  };
  profile: null | Record<string, unknown> & { coverUrl?: string | null; city?: string | null; bio?: string | null; profileVisibility?: string; lastSeenAt?: string | null; counters?: Record<string, number> };
  subscriptions: Array<{ subscription_id: string; plan_id: string; status: string; billing_period: string; platform: string; provider: string; provider_mode?: string | null; amount_minor: number; currency: string; current_recurring_amount_minor?: number | null; started_at?: string | null; current_period_ends_at?: string | null; renews_at?: string | null; cancel_at_period_end?: boolean; cancellation_reason?: string | null; last_successful_payment_at?: string | null; last_failed_payment_at?: string | null }>;
  payments: Array<{ transaction_id: string; subscription_id: string; reference: string; invoice_code?: string | null; amount_minor: number; currency: string; provider_mode: string; paid_at: string }>;
  invoices: Array<{ invoice_code: string; subscription_id: string; status: string; amount_minor?: number | null; currency?: string | null; due_at?: string | null; paid_at?: string | null; updated_at: string }>;
  moderation: { reports_involving_account: number; active_sessions: number; latest_verification: null | { application_id: string; status: string; submitted_at: string } };
  reports: Array<{ report_id: string; kind: string; direction: "received" | "submitted"; reason: string; details?: string | null; status: string; evidence_urls: string[]; created_at: string }>;
  verifications: Array<{ application_id: string; type: string; status: string; documents: unknown[]; additional_info?: string | null; reviewed_at?: string | null; reviewed_by?: string | null; rejection_reason?: string | null; submitted_at: string }>;
  activity: { highlights: number; trial_applications: number; analytics_events: number; notifications: number };
  highlights: Array<{ highlight_id: string; caption?: string | null; tags: string[]; position_tags: string[]; visibility: string; status: string; media: unknown; thumbnail_url?: string | null; ai_rating?: unknown; stats: unknown; created_at: string; deleted_at?: string | null }>;
  trial_applications: Array<{ application_id: string; trial_id: string; position: string; status: string; payment_status?: string | null; message?: string | null; rating?: number | null; created_at: string }>;
  analytics_events: Array<{ event_id: string; name: string; role: string; entity_type?: string | null; entity_id?: string | null; source: string; platform?: string | null; country?: string | null; occurred_at: string; properties: Record<string, unknown> }>;
  notifications: Array<{ notification_id: string; type: string; category: string; title: string; body: string; priority: string; read_at?: string | null; created_at: string }>;
  relationships: Record<"followers" | "following" | "blocked_by_user" | "blocked_user", Array<{ account: { user_id: string; full_name: string; username: string; avatar_url?: string | null; account_type?: string | null; status?: string | null }; created_at: string; reason?: string | null }>>;
  sessions: Array<{ session_id: string; device_name: string; device_type: string; ip_address?: string | null; user_agent?: string | null; last_used_at: string; expires_at: string; absolute_expires_at: string; revoked_at?: string | null; revoke_reason?: string | null; created_at: string }>;
  audit_history: Array<{ audit_id: string; admin_id: string; action: string; reason: string; before: unknown; after: unknown; created_at: string }>;
};

export type ApiEnvelope<T> = { success: true; data: T; meta: { request_id: string; timestamp: string } };
