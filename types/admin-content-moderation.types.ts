export type ModerationTarget = "highlight" | "comment" | "profile";
export type ModerationSeverity = "critical" | "high" | "medium" | "low";

export type ModerationPerson = { user_id: string; full_name: string; username: string; avatar_url: string | null; account_type: string; status: string };
export type ModerationReport = { report_id: string; reporter_user_id: string; reporter: ModerationPerson | null; reason: string; details: string | null; created_at: string };
export type ModerationDecision = { decision_id: string; target_type: ModerationTarget; target_id: string; action: string; status: string; reason: string; admin_id: string; before?: unknown; after?: unknown; created_at: string };

export type ModerationCase = {
  case_id: string;
  target_type: ModerationTarget;
  target_id: string;
  status: "open" | "dismissed" | "actioned" | "escalated";
  severity: ModerationSeverity;
  report_count: number;
  latest_report_at: string;
  owner: ModerationPerson | null;
  reports: ModerationReport[];
  content: Record<string, unknown> | null;
  latest_decision: Omit<ModerationDecision, "target_type" | "target_id"> | null;
};

export type ContentModerationData = {
  generated_at: string;
  summary: { total_cases: number; open_cases: number; critical_cases: number; reported_highlights: number; reported_comments: number; reported_profiles: number; escalated_cases: number; actioned_cases: number; total_reports: number };
  cases: ModerationCase[];
  decision_history: ModerationDecision[];
};
