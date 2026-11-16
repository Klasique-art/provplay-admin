import type { AccountStatus, AccountType } from "./admin-user.types";

export type OverviewRevenue = { currency: string; amount_minor: number; transaction_count: number; change_percent: number | null };
export type AdminOverview = {
  generated_at: string;
  period: { days: 7 | 30 | 90; starts_at: string; ends_at: string };
  accounts: {
    total: number; active: number; new_in_period: number; change_percent: number | null;
    by_type: Record<AccountType, number>; by_status: Record<AccountStatus, number>;
  };
  subscriptions: {
    active_subscribers: number; new_in_period: number; change_percent: number | null;
    past_due: number; ending_within_7_days: number; by_plan: Record<string, number>;
  };
  revenue: OverviewRevenue[];
  engagement: { active_users_in_period: number; active_sessions: number; published_highlights: number; new_highlights_in_period: number };
  trust_and_safety: { open_reports: number; user_reports: number; message_reports: number; content_reports: number; verification_queue: number; suspended_accounts: number };
  operations: { pending_deletions: number };
  recent_accounts: Array<{ user_id: string; full_name: string; username: string; email: string; account_type: AccountType | null; status: AccountStatus; avatar_url: string | null; country: string | null; joined_at: string }>;
};
