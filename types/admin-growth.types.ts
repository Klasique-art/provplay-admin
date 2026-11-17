import type { AccountType } from "./admin-user.types";

export type GrowthAnalytics = {
  generated_at: string;
  period: { days: 7 | 30 | 90; starts_at: string; ends_at: string };
  summary: {
    total_users: number;
    new_users: number;
    new_users_change_percent: number | null;
    active_users: number;
    active_users_change_percent: number | null;
    onboarding_completion_percent: number;
    average_session_seconds: number;
    measured_sessions: number;
  };
  series: Array<{ date: string; signups: number; active_users: number }>;
  countries: Array<{ country_code: string; users: number; percentage: number }>;
  platforms: Array<{ platform: string; active_users: number; percentage: number }>;
  account_types: Record<AccountType | "unassigned", number>;
  methodology: { active_user: string; session_duration: string; country: string; platform: string };
};
