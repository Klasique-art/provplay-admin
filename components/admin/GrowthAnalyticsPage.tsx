"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrowthAnalytics } from "@/types/admin-growth.types";
import type { ApiEnvelope } from "@/types/admin-user.types";

const roleLabels: Record<string, string> = { player: "Players", coach: "Coaches", scout: "Scouts", agent: "Agents", club: "Clubs", academy: "Academies", unassigned: "Type not set" };

export function GrowthAnalyticsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<GrowthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics/growth?days=${days}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Growth analytics could not be loaded.");
      setData((payload as ApiEnvelope<GrowthAnalytics>).data);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Growth analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const refresh = window.setInterval(() => void load(), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(refresh); };
  }, [load]);

  function exportCsv() {
    if (!data) return;
    const rows = [["Date", "Signups", "Active users"], ...data.series.map((row) => [row.date, row.signups, row.active_users])];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `provplay-growth-${days}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) return <GrowthSkeleton />;
  if (error && !data) return <ErrorState message={error} retry={() => { setLoading(true); void load(); }} />;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:p-7">
        <div><p className="m-0 text-sm font-extrabold uppercase tracking-[.14em] text-[#B58A00]">Analytics</p><h1 className="mb-2 mt-2 text-3xl font-extrabold tracking-tight text-[#0F1F42]">Growth analytics</h1><p className="m-0 max-w-3xl text-base leading-7 text-slate-600">Acquisition, active use, geography, device platform, onboarding, and session engagement across ProvPlay.</p><p className="mb-0 mt-3 text-sm text-slate-500">Updated {formatDateTime(data.generated_at)} · refreshes every minute</p></div>
        <div className="flex flex-wrap gap-2"><label className="grid gap-1 text-xs font-bold text-slate-600"><span>Reporting period</span><select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm" onChange={(event) => { setLoading(true); setDays(Number(event.target.value) as 7 | 30 | 90); }} value={days}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label><button className="button button--secondary self-end" onClick={() => void load()}>Refresh</button><button className="button button--primary self-end" onClick={exportCsv}>Export CSV</button></div>
      </header>

      {error ? <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">The latest refresh failed: {error}. Showing the last successful snapshot.</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total accounts" value={number(data.summary.total_users)} detail="All registered accounts" />
        <Metric label="New accounts" value={number(data.summary.new_users)} detail={`In the last ${days} days`} change={data.summary.new_users_change_percent} />
        <Metric label="Active users" value={number(data.summary.active_users)} detail="Distinct tracked users" change={data.summary.active_users_change_percent} />
        <Metric label="Average session" value={duration(data.summary.average_session_seconds)} detail={`${number(data.summary.measured_sessions)} measured sessions`} />
        <Metric label="Onboarding complete" value={`${data.summary.onboarding_completion_percent}%`} detail="Of all accounts" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
        <Panel title="Growth and daily activity" eyebrow="Trend"><TrendChart data={data.series} /></Panel>
        <Panel title="Active users by platform" eyebrow="Devices"><PlatformBreakdown rows={data.platforms} total={data.summary.active_users} /></Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Users by country" eyebrow="Geography"><CountryTable rows={data.countries} total={data.summary.total_users} /></Panel>
        <Panel title="Accounts by role" eyebrow="Audience"><RoleBreakdown rows={data.account_types} /></Panel>
      </section>

      <Panel title="How these numbers are calculated" eyebrow="Data notes"><div className="grid gap-4 md:grid-cols-2">{Object.entries(data.methodology).map(([key, value]) => <div className="rounded-xl bg-slate-50 p-4" key={key}><strong className="text-sm capitalize text-[#0F1F42]">{key.replaceAll("_", " ")}</strong><p className="mb-0 mt-2 text-sm leading-6 text-slate-600">{value}</p></div>)}</div></Panel>
    </div>
  );
}

function Metric({ label, value, detail, change }: { label: string; value: string; detail: string; change?: number | null }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-sm font-bold text-slate-500">{label}</span><strong className="mt-3 block text-3xl font-extrabold tracking-tight text-[#0F1F42]">{value}</strong><div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">{change !== undefined && change !== null ? <span className={`font-extrabold ${change >= 0 ? "text-emerald-700" : "text-red-700"}`}>{change >= 0 ? "+" : ""}{change}%</span> : null}<span>{detail}</span></div></article>; }
function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="m-0 text-xs font-extrabold uppercase tracking-[.13em] text-[#B58A00]">{eyebrow}</p><h2 className="mb-5 mt-1 text-xl">{title}</h2>{children}</section>; }

function TrendChart({ data }: { data: GrowthAnalytics["series"] }) {
  const width = 900, height = 260, inset = 28;
  const max = Math.max(...data.flatMap((row) => [row.signups, row.active_users]), 1);
  const points = (key: "signups" | "active_users") => data.map((row, index) => `${inset + (index / Math.max(data.length - 1, 1)) * (width - inset * 2)},${height - inset - (row[key] / max) * (height - inset * 2)}`).join(" ");
  const labels = data.length > 1 ? [data[0], data[Math.floor((data.length - 1) / 2)], data.at(-1)!] : data;
  return <div><div className="mb-4 flex flex-wrap gap-4 text-sm"><Legend color="#E6B800" label="New accounts" /><Legend color="#162A5C" label="Daily active users" /></div><div className="overflow-x-auto"><svg aria-label="Signups and daily active users chart" className="h-[260px] min-w-[620px] w-full" preserveAspectRatio="none" role="img" viewBox={`0 0 ${width} ${height}`}><line stroke="#E2E8F0" x1={inset} x2={width - inset} y1={height - inset} y2={height - inset} /><line stroke="#E2E8F0" x1={inset} x2={width - inset} y1={inset} y2={inset} /><polyline fill="none" points={points("active_users")} stroke="#162A5C" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" /><polyline fill="none" points={points("signups")} stroke="#E6B800" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" /></svg></div><div className="flex justify-between text-xs text-slate-500">{labels.map((row) => <span key={row.date}>{shortDate(row.date)}</span>)}</div></div>;
}
function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><i className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>; }

function PlatformBreakdown({ rows, total }: { rows: GrowthAnalytics["platforms"]; total: number }) { if (!rows.length) return <Empty text="No platform activity has been recorded for this period." />; return <div className="space-y-3">{rows.map((row) => <div className="rounded-xl border border-slate-200 p-4" key={row.platform}><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#F0F4FA] text-sm font-extrabold uppercase text-[#162A5C]">{platformShort(row.platform)}</span><div><strong className="block capitalize">{platformName(row.platform)}</strong><span className="text-xs text-slate-500">{row.percentage}% of active users</span></div></div><strong className="text-xl tabular-nums text-[#0F1F42]">{number(row.active_users)}</strong></div><Progress value={row.active_users} max={Math.max(total, 1)} /></div>)}</div>; }
function CountryTable({ rows, total }: { rows: GrowthAnalytics["countries"]; total: number }) { const shown = rows.slice(0, 12); return shown.length ? <div className="overflow-x-auto"><table className="w-full min-w-[500px] border-collapse text-left"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="pb-3">Country</th><th className="pb-3">Users</th><th className="pb-3">Share</th></tr></thead><tbody>{shown.map((row) => <tr className="border-b border-slate-100 text-sm" key={row.country_code}><td className="py-3 font-bold text-slate-800">{countryName(row.country_code)}</td><td className="py-3 tabular-nums">{number(row.users)}</td><td className="w-1/2 py-3"><div className="flex items-center gap-3"><Progress value={row.users} max={Math.max(total, 1)} /><span className="w-12 text-right tabular-nums text-slate-500">{row.percentage}%</span></div></td></tr>)}</tbody></table></div> : <Empty text="No account country data is available." />; }
function RoleBreakdown({ rows }: { rows: GrowthAnalytics["account_types"] }) { const entries = Object.entries(rows); const max = Math.max(...entries.map(([, value]) => value), 1); return <div className="grid gap-4 sm:grid-cols-2">{entries.map(([role, count]) => <div key={role}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-bold text-slate-700">{roleLabels[role] ?? role}</span><strong>{number(count)}</strong></div><Progress value={count} max={max} /></div>)}</div>; }
function Progress({ value, max }: { value: number; max: number }) { return <div className="mt-3 h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full min-w-[2px] rounded-full bg-[#E6B800]" style={{ width: `${Math.min((value / max) * 100, 100)}%` }} /></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{text}</div>; }
function GrowthSkeleton() { return <div className="mx-auto max-w-[1600px] animate-pulse space-y-5"><div className="h-48 rounded-2xl bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0,1,2,3,4].map((item) => <div className="h-36 rounded-2xl bg-slate-200" key={item} />)}</div><div className="h-96 rounded-2xl bg-slate-200" /></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="grid min-h-[65vh] place-items-center"><div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><h1 className="m-0 text-2xl">Growth analytics could not be loaded</h1><p className="mb-5 mt-3 text-sm leading-6 text-slate-600">{message}</p><button className="button button--primary" onClick={retry}>Try again</button></div></div>; }
function countryName(code: string) { if (code.toLowerCase() === "unknown") return "Unknown"; try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase(); } catch { return code.toUpperCase(); } }
function platformName(value: string) { const key = value.toLowerCase(); return key === "ios" ? "iOS" : key === "android" ? "Android" : key === "web" ? "Web" : "Unknown"; }
function platformShort(value: string) { const key = value.toLowerCase(); return key === "ios" ? "iOS" : key === "android" ? "AN" : key === "web" ? "WEB" : "?"; }
function duration(seconds: number) { if (!seconds) return "0m"; const hours = Math.floor(seconds / 3600), minutes = Math.max(1, Math.round((seconds % 3600) / 60)); return hours ? `${hours}h ${minutes}m` : `${minutes}m`; }
function number(value: number) { return value.toLocaleString(); }
function shortDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
