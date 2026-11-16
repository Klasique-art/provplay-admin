"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminOverview, OverviewRevenue } from "@/types/admin-overview.types";
import type { AccountType, ApiEnvelope } from "@/types/admin-user.types";
import { AccountAvatar } from "./AccountAvatar";

const accountTypes: Array<{ id: AccountType | "unassigned"; label: string }> = [
  { id: "player", label: "Players" }, { id: "coach", label: "Coaches" }, { id: "scout", label: "Scouts" },
  { id: "agent", label: "Agents" }, { id: "club", label: "Clubs" }, { id: "academy", label: "Academies" },
  { id: "unassigned", label: "Account type not set" },
];

export function PlatformOverview() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/overview?days=${days}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "The platform overview could not be loaded.");
      setData((payload as ApiEnvelope<AdminOverview>).data);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The platform overview could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  function exportSnapshot() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `provplay-overview-${new Date(data.generated_at).toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) return <OverviewSkeleton />;
  if (error && !data) return <OverviewError message={error} retry={() => void load()} />;
  if (!data) return null;

  const primaryRevenue = data.revenue[0];
  const subscriberRate = data.accounts.total ? (data.subscriptions.active_subscribers / data.accounts.total) * 100 : 0;
  const maxAccountCount = Math.max(...Object.values(data.accounts.by_type), 1);
  const maxPlanCount = Math.max(...Object.values(data.subscriptions.by_plan), 1);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-[#07112B] p-5 text-white shadow-sm md:flex-row md:items-end md:p-7">
        <div>
          <p className="m-0 text-sm font-extrabold uppercase tracking-[.16em] text-[#E6B800]">Control centre</p>
          <h1 className="mb-2 mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Platform overview</h1>
          <p className="m-0 max-w-2xl text-base leading-7 text-slate-300">Live operational data across ProvPlay accounts, subscriptions, revenue, engagement, and safety.</p>
          <p className="mb-0 mt-3 flex items-center gap-2 text-sm text-slate-400"><span className="size-2 rounded-full bg-emerald-400" />Updated {formatDateTime(data.generated_at)} · refreshes every minute</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="grid gap-1 text-xs font-bold text-slate-300"><span>Reporting period</span><select className="h-11 rounded-lg border border-slate-600 bg-[#0F1F42] px-3 text-sm text-white" onChange={(event) => { setLoading(true); setDays(Number(event.target.value) as 7 | 30 | 90); }} value={days}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label>
          <button className="button button--secondary self-end" onClick={() => void load()} type="button">Refresh</button>
          <button className="button button--primary self-end" onClick={exportSnapshot} type="button">Export snapshot</button>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">The last refresh failed: {error}. Showing the most recently loaded snapshot.</div> : null}

      <section aria-label="Key platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail={`${data.accounts.new_in_period.toLocaleString()} joined in this period`} href="/users" label="Total accounts" trend={data.accounts.change_percent} value={data.accounts.total.toLocaleString()} />
        <MetricCard detail={`${subscriberRate.toFixed(1)}% of all accounts`} href="/billing/subscriptions" label="Active subscribers" trend={data.subscriptions.change_percent} value={data.subscriptions.active_subscribers.toLocaleString()} />
        <MetricCard detail={primaryRevenue ? `${primaryRevenue.transaction_count.toLocaleString()} live transactions` : "No live payments recorded"} href="/analytics/revenue" label={`Revenue (GHC) · ${days} days`} trend={primaryRevenue?.change_percent} value={primaryRevenue ? money(primaryRevenue) : "GHC 0.00"} />
        <MetricCard detail={`${data.engagement.active_sessions.toLocaleString()} users with active sessions`} href="/analytics/engagement" label="Active users" value={data.engagement.active_users_in_period.toLocaleString()} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <Panel eyebrow="Audience" title="Accounts by type" action={<Link className="text-sm font-bold text-[#8A6A00]" href="/analytics/growth">Open growth analytics →</Link>}>
          <div className="grid gap-4 sm:grid-cols-2">
            {accountTypes.map((type) => <Bar key={type.id} label={type.label} max={maxAccountCount} value={data.accounts.by_type[type.id]} />)}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4">
            <SmallStat label="Active" tone="green" value={data.accounts.by_status.active} />
            <SmallStat label="Suspended" tone="red" value={data.accounts.by_status.suspended} />
            <SmallStat label="Deactivated" value={data.accounts.by_status.deactivated} />
            <SmallStat label="Deletion pending" tone="amber" value={data.accounts.by_status.pending_deletion} />
          </div>
        </Panel>
        <Panel eyebrow="Revenue" title="Subscriber plan mix" action={<Link className="text-sm font-bold text-[#8A6A00]" href="/analytics/subscriptions">View subscribers →</Link>}>
          {Object.keys(data.subscriptions.by_plan).length ? <div className="space-y-5">{Object.entries(data.subscriptions.by_plan).sort(([, a], [, b]) => b - a).map(([plan, count]) => <Bar key={plan} label={titleCase(plan)} max={maxPlanCount} value={count} />)}</div> : <EmptyState text="No active paid subscription records are available yet." />}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5"><SmallStat label="Past due" tone="red" value={data.subscriptions.past_due} /><SmallStat label="Ending in 7 days" tone="amber" value={data.subscriptions.ending_within_7_days} /></div>
          {data.revenue.length > 1 ? <p className="mb-0 mt-4 text-sm leading-6 text-slate-500">Revenue is separated by currency: {data.revenue.map(money).join(" · ")}.</p> : null}
        </Panel>
      </section>

      <section>
        <div className="mb-3"><p className="m-0 text-sm font-extrabold uppercase tracking-[.13em] text-[#B58A00]">Needs attention</p><h2 className="mb-0 mt-1 text-xl">Operational queues</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QueueCard count={data.trust_and_safety.open_reports} detail={`${data.trust_and_safety.user_reports} account · ${data.trust_and_safety.message_reports} message · ${data.trust_and_safety.content_reports} content`} href="/moderation/reports" label="Open safety reports" urgent />
          <QueueCard count={data.trust_and_safety.verification_queue} detail="Pending or under review" href="/verification" label="Verification reviews" />
          <QueueCard count={data.subscriptions.past_due} detail="Subscriptions requiring payment review" href="/billing/subscriptions" label="Past-due subscriptions" urgent={data.subscriptions.past_due > 0} />
          <QueueCard count={data.operations.pending_deletions} detail="Privacy deletion workflow" href="/platform/privacy" label="Pending deletions" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.75fr]">
        <Panel eyebrow="Latest growth" title="Recently joined accounts" action={<Link className="text-sm font-bold text-[#8A6A00]" href="/users">View all accounts →</Link>} noPadding>
          {data.recent_accounts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead><tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Account</th><th>Type</th><th>Status</th><th>Joined</th><th className="px-5 text-right">Action</th></tr></thead><tbody>{data.recent_accounts.map((account) => <tr className="border-b border-slate-100 text-sm" key={account.user_id}><td className="px-5 py-4"><div className="flex items-center gap-3"><AccountAvatar className="size-10 text-xs" name={account.full_name} sizes="40px" src={account.avatar_url} /><div><strong className="block text-slate-900">{account.full_name}</strong><span className="text-xs text-slate-500">@{account.username}</span></div></div></td><td className="capitalize text-slate-600">{account.account_type ?? "Not selected"}</td><td><StatusBadge status={account.status} /></td><td className="text-slate-600">{formatDate(account.joined_at)}</td><td className="px-5 text-right"><Link className="font-bold text-[#8A6A00]" href={`/users/${encodeURIComponent(account.user_id)}`}>Review →</Link></td></tr>)}</tbody></table></div> : <EmptyState text="No accounts have been created yet." />}
        </Panel>
        <Panel eyebrow="Content & access" title="Platform activity">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <ActivityRow href="/content/highlights" label="Published highlights" supporting={`${data.engagement.new_highlights_in_period.toLocaleString()} added this period`} value={data.engagement.published_highlights} />
            <ActivityRow href="/analytics/engagement" label="Active sessions" supporting="Unrevoked, unexpired user sessions" value={data.engagement.active_sessions} />
            <ActivityRow href="/moderation/reports" label="Suspended accounts" supporting="Currently restricted from platform access" value={data.trust_and_safety.suspended_accounts} />
          </div>
          <div className="mt-5 rounded-xl bg-[#F0F4FA] p-4"><strong className="text-sm text-[#0F1F42]">How activity is measured</strong><p className="mb-0 mt-2 text-sm leading-6 text-slate-600">Active users are distinct signed-in actors recorded by analytics during this period. Bot and internal events are excluded.</p></div>
        </Panel>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, href, trend }: { label: string; value: string; detail: string; href: string; trend?: number | null }) { return <Link className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4A000] hover:shadow-md" href={href}><div className="flex items-start justify-between gap-3"><span className="text-sm font-bold text-slate-500">{label}</span><span className="text-slate-400 group-hover:text-[#B58A00]">↗</span></div><strong className="mt-3 block text-3xl font-extrabold tracking-tight text-[#0F1F42]">{value}</strong><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">{trend !== undefined && trend !== null ? <span className={`font-extrabold ${trend >= 0 ? "text-emerald-700" : "text-red-700"}`}>{trend >= 0 ? "+" : ""}{trend}%</span> : null}<span>{detail}</span></div></Link>; }
function Panel({ eyebrow, title, action, children, noPadding = false }: { eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode; noPadding?: boolean }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-end justify-between gap-4 p-5"><div><p className="m-0 text-xs font-extrabold uppercase tracking-[.13em] text-[#B58A00]">{eyebrow}</p><h2 className="mb-0 mt-1 text-xl">{title}</h2></div>{action}</div><div className={noPadding ? "" : "px-5 pb-5"}>{children}</div></section>; }
function Bar({ label, value, max }: { label: string; value: number; max: number }) { return <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-700">{label}</span><strong className="tabular-nums text-[#0F1F42]">{value.toLocaleString()}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full min-w-[3px] rounded-full bg-[#E6B800]" style={{ width: `${(value / max) * 100}%` }} /></div></div>; }
function SmallStat({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "amber" | "red" }) { const colors = { slate: "bg-slate-50 text-slate-700", green: "bg-emerald-50 text-emerald-800", amber: "bg-amber-50 text-amber-800", red: "bg-red-50 text-red-800" }; return <div className={`rounded-xl p-3 ${colors[tone]}`}><strong className="block text-xl tabular-nums">{value.toLocaleString()}</strong><span className="mt-1 block text-xs font-bold">{label}</span></div>; }
function QueueCard({ label, count, detail, href, urgent = false }: { label: string; count: number; detail: string; href: string; urgent?: boolean }) { return <Link className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${urgent && count ? "border-red-200" : "border-slate-200"}`} href={href}><div className="flex items-center justify-between"><strong className={`text-3xl tabular-nums ${urgent && count ? "text-red-700" : "text-[#0F1F42]"}`}>{count.toLocaleString()}</strong><span className="text-slate-400">→</span></div><h3 className="mb-1 mt-3 text-base">{label}</h3><p className="m-0 text-xs leading-5 text-slate-500">{detail}</p></Link>; }
function ActivityRow({ label, value, supporting, href }: { label: string; value: number; supporting: string; href: string }) { return <Link className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-[#D4A000]" href={href}><div><strong className="text-sm text-slate-800">{label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{supporting}</span></div><strong className="text-xl tabular-nums text-[#0F1F42]">{value.toLocaleString()}</strong></Link>; }
function StatusBadge({ status }: { status: string }) { const style = status === "active" ? "bg-emerald-100 text-emerald-700" : status === "suspended" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${style}`}>{status.replaceAll("_", " ")}</span>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</div>; }
function OverviewSkeleton() { return <div className="mx-auto max-w-[1600px] animate-pulse space-y-5"><div className="h-52 rounded-2xl bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-36 rounded-2xl bg-slate-200" key={item} />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-80 rounded-2xl bg-slate-200" /><div className="h-80 rounded-2xl bg-slate-200" /></div></div>; }
function OverviewError({ message, retry }: { message: string; retry: () => void }) { return <div className="grid min-h-[65vh] place-items-center"><div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-xl text-red-700">!</span><h1 className="mb-2 mt-4 text-2xl">Platform data could not be loaded</h1><p className="mb-5 mt-0 text-sm leading-6 text-slate-600">{message}</p><button className="button button--primary" onClick={retry}>Try again</button></div></div>; }
function money(revenue: OverviewRevenue) { return `GHC ${new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(revenue.amount_minor / 100)}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
