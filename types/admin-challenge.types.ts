export type ChallengePerson = {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  account_type: string;
  status: string;
  verification_status: string | null;
};
export type ChallengeSubmission = {
  submission_id: string;
  player: ChallengePerson | null;
  highlight_id: string;
  title: string;
  description: string | null;
  status: string;
  community_score: number;
  jury_score: number | null;
  total_score: number;
  vote_count: number;
  jury_score_count: number;
  rank: number | null;
  media: Record<string, unknown> | null;
  thumbnail_url: string | null;
  jury_scores: Array<{
    juror: ChallengePerson | null;
    scores: unknown;
    weighted_score: number;
    comments: string | null;
    recommendation: string | null;
    created_at: string;
  }>;
  created_at: string;
};
export type AdminChallenge = {
  challenge_id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  cover_image_url: string | null;
  phase: string;
  phases: Record<string, { startsAt: string; endsAt: string }>;
  prizes: unknown;
  rules: string[];
  jury_panel: ChallengePerson[];
  winners: Array<Record<string, unknown>>;
  results_published_at: string | null;
  completed_at: string | null;
  view_count: number;
  submissions: ChallengeSubmission[];
  prize_leads: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};
export type AdminChallengeData = {
  generated_at: string;
  summary: {
    total: number;
    live: number;
    upcoming: number;
    pending_submissions: number;
    published_results: number;
    unclaimed_prizes: number;
  };
  items: AdminChallenge[];
};
