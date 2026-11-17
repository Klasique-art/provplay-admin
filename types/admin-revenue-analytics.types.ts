export type RevenueBreakdown = { ghc_revenue_minor: number; transactions: number };

export type RevenueAnalytics = {
  generated_at: string;
  period: { days: 7 | 30 | 90; starts_at: string; ends_at: string };
  summary: {
    ghc_revenue_minor: number;
    revenue_change_percent: number | null;
    successful_transactions: number;
    transactions_change_percent: number | null;
    paying_users: number;
    average_transaction_minor: number;
    average_revenue_per_payer_minor: number;
    estimated_mrr_minor: number;
    failed_invoices: number;
    failed_invoice_amount_minor: number;
  };
  series: Array<{ date: string; ghc_revenue_minor: number; transactions: number; paying_users: number }>;
  by_plan: Array<RevenueBreakdown & { plan: string }>;
  by_provider: Array<RevenueBreakdown & { provider: string }>;
  by_platform: Array<RevenueBreakdown & { platform: string }>;
  estimated_mrr_by_plan: Array<{ plan: string; ghc_mrr_minor: number; active_subscriptions: number }>;
  invoice_status: Record<string, { count: number; ghc_amount_minor: number }>;
  methodology: Record<string, string>;
};
