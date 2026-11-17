export type SubscriptionAnalytics = {
  generated_at: string;
  period: { days: 7 | 30 | 90; starts_at: string; ends_at: string };
  summary: {
    active_subscribers: number; subscriber_conversion_percent: number;
    new_subscribers: number; new_subscribers_change_percent: number | null;
    churned_subscribers: number; churn_change_percent: number | null; churn_rate_percent: number;
    upcoming_renewals_30_days: number; successful_payments: number; paying_users: number; ghc_revenue_minor: number;
  };
  series: Array<{ date: string; new_subscriptions: number; churned_subscriptions: number }>;
  by_status: Record<string, number>; by_plan: Record<string, number>; by_billing_period: Record<string, number>;
  by_platform: Record<string, number>; by_provider: Record<string, number>;
  methodology: Record<string, string>;
};
