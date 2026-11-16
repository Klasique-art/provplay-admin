"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AccountStatus, AccountType, AdminUserListItem, AdminUserListResponse, ApiEnvelope, SubscriptionPlan } from "@/types/admin-user.types";
import { AccountAvatar } from "./AccountAvatar";

const accountTypes: Array<{ id: "all" | AccountType; label: string }> = [
  { id: "all", label: "All accounts" }, { id: "player", label: "Players" }, { id: "coach", label: "Coaches" },
  { id: "scout", label: "Scouts" }, { id: "agent", label: "Agents" }, { id: "club", label: "Clubs" }, { id: "academy", label: "Academies" },
];

const blankCounts: Record<AccountType, number> = { player: 0, coach: 0, scout: 0, agent: 0, club: 0, academy: 0 };
const verificationAccountTypes = new Set<AccountType>(["scout", "agent", "club", "academy"]);

export function AccountTypeTabs() {
  const [activeType, setActiveType] = useState<"all" | AccountType>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | AccountStatus>("all");
  const [verification, setVerification] = useState("all");
  const [plan, setPlan] = useState<"all" | SubscriptionPlan>("all");
  const [sort, setSort] = useState("newest");
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const cursor = cursorHistory.at(-1);

  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setCursorHistory([]); setSelected(new Set()); }, 350); return () => window.clearTimeout(timer); }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "25", sort });
    if (activeType !== "all") params.set("account_type", activeType);
    if (status !== "all") params.set("status", status);
    if (verification !== "all") params.set("verification", verification);
    if (plan !== "all") params.set("subscription", plan);
    if (search) params.set("search", search);
    if (cursor) params.set("cursor", cursor);
    fetch(`/api/admin/users?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Unable to load accounts.");
        return (payload as ApiEnvelope<AdminUserListResponse>).data;
      })
      .then((nextData) => { setData(nextData); setError(null); })
      .catch((reason) => { if (reason instanceof DOMException && reason.name === "AbortError") return; setData(null); setError(reason instanceof Error ? reason.message : "Unable to load accounts."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [activeType, cursor, plan, retryKey, search, sort, status, verification]);

  const counts = data?.counts.by_account_type ?? blankCounts;
  const allCount = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const rows = data?.items ?? [];
  const allPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.user_id));
  const activeLabel = accountTypes.find((type) => type.id === activeType)?.label ?? "All accounts";
  const verificationApplicable = activeType === "all" || verificationAccountTypes.has(activeType);
  const hasFilters = status !== "all" || verification !== "all" || plan !== "all" || Boolean(searchInput);

  const togglePage = () => setSelected((current) => { const next = new Set(current); if (allPageSelected) rows.forEach((row) => next.delete(row.user_id)); else rows.forEach((row) => next.add(row.user_id)); return next; });
  const toggleRow = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const resetPage = () => { setCursorHistory([]); setSelected(new Set()); setLoading(true); };
  const clearFilters = () => { resetPage(); setSearchInput(""); setSearch(""); setStatus("all"); setVerification("all"); setPlan("all"); setSort("newest"); };

  return (
    <section className="mb-4 overflow-hidden rounded-[14px] border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 pt-4">
        <div className="flex items-center justify-between gap-4"><div><p className="m-0 text-xs font-extrabold uppercase tracking-[.12em] text-[#B58A00]">Account directory</p><h2 className="mb-0 mt-1 text-lg">Manage every ProvPlay account</h2></div><button className="button button--secondary">Export accounts</button></div>
        <div className="mt-3 flex overflow-x-auto">
          {accountTypes.map((type) => { const count = type.id === "all" ? allCount : counts[type.id]; const active = type.id === activeType; return <button className={`shrink-0 border-b-2 px-3 py-3 text-sm font-bold ${active ? "border-[#E6B800] text-[#0F1F42]" : "border-transparent text-slate-500 hover:text-slate-900"}`} key={type.id} onClick={() => { resetPage(); setActiveType(type.id); if (type.id !== "all" && !verificationAccountTypes.has(type.id)) setVerification("all"); }} type="button">{type.label}<span className={`ml-1.5 rounded-full px-2 py-0.5 text-[11px] tabular-nums ${active ? "bg-[#FDF5CC] text-[#8A6A00]" : "bg-slate-100 text-slate-500"}`}>{count.toLocaleString()}</span></button>; })}
        </div>
      </div>
      <div className="border-b border-slate-200 p-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_repeat(4,auto)]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3"><span className="text-slate-400">⌕</span><span className="sr-only">Search accounts</span><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" onChange={(event) => setSearchInput(event.target.value)} placeholder={`Search ${activeLabel.toLowerCase()} by name, email, username, or ID`} value={searchInput} /></label>
          <FilterSelect label="Status" onChange={(value) => { resetPage(); setStatus(value as typeof status); }} value={status} options={["all","active","suspended","deactivated","pending_deletion"]} />
          {verificationApplicable ? <FilterSelect label="Professional verification" onChange={(value) => { resetPage(); setVerification(value); }} value={verification} options={["all","verified","pending","unverified"]} /> : null}
          <FilterSelect label="Plan" onChange={(value) => { resetPage(); setPlan(value as typeof plan); }} value={plan} options={["all","free","premium","pro","max"]} />
          <FilterSelect label="Sort" onChange={(value) => { resetPage(); setSort(value); }} value={sort} options={["newest","oldest","name"]} />
        </div>
        <div className="mt-3 flex min-h-6 items-center justify-between gap-3"><p className="m-0 text-sm text-slate-500">{loading ? "Refreshing accounts…" : `${(data?.total_count ?? 0).toLocaleString()} ${activeLabel.toLowerCase()} found`}</p>{hasFilters ? <button className="text-sm font-bold text-[#8A6A00]" onClick={clearFilters}>Clear all filters</button> : null}</div>
      </div>
      {selected.size ? <div className="flex items-center justify-between gap-3 border-b border-[#FAE599] bg-[#FFFBEB] px-4 py-3"><strong className="text-sm">{selected.size} account{selected.size === 1 ? "" : "s"} selected</strong><div className="flex gap-3"><button className="text-sm font-bold text-[#0F1F42]">Export selection</button><button className="text-sm font-bold text-red-700">Review restrictions</button></div></div> : null}
      {error ? <DirectoryMessage title="Accounts could not be loaded" detail={error}><button className="button button--primary" onClick={() => { setLoading(true); setRetryKey((key) => key + 1); }}>Try again</button></DirectoryMessage> : loading ? <TableSkeleton /> : rows.length === 0 ? <DirectoryMessage title="No accounts match this view" detail="Change the account type or clear one or more filters to widen the results."><button className="button button--secondary" onClick={clearFilters}>Clear filters</button></DirectoryMessage> : <UserTable allSelected={allPageSelected} onTogglePage={togglePage} onToggleRow={toggleRow} rows={rows} selected={selected} />}
      {!error && !loading && rows.length ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><span className="text-sm text-slate-500">Showing {rows.length} records on this page</span><div className="flex gap-2"><button className="button button--secondary disabled:cursor-not-allowed disabled:opacity-40" disabled={!cursorHistory.length} onClick={() => setCursorHistory((history) => history.slice(0, -1))}>Previous</button><button className="button button--secondary disabled:cursor-not-allowed disabled:opacity-40" disabled={!data?.next_cursor} onClick={() => data?.next_cursor && setCursorHistory((history) => [...history, data.next_cursor!])}>Next</button></div></div> : null}
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="grid gap-1"><span className="sr-only">{label}</span><select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm capitalize" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option} value={option}>{option === "all" ? `All ${label.toLowerCase()}` : option.replaceAll("_", " ")}</option>)}</select></label>; }
function DirectoryMessage({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">◎</span><h3 className="m-0 text-base">{title}</h3><p className="mx-auto mb-4 mt-2 max-w-md text-sm leading-5 text-slate-500">{detail}</p>{children}</div></div>; }
function TableSkeleton() { return <div className="animate-pulse p-4">{[0,1,2,3,4].map((row) => <div className="mb-2 h-14 rounded-lg bg-slate-100" key={row} />)}</div>; }
function UserTable({ rows, selected, allSelected, onToggleRow, onTogglePage }: { rows: AdminUserListItem[]; selected: Set<string>; allSelected: boolean; onToggleRow: (id: string) => void; onTogglePage: () => void }) { return <div className="overflow-x-auto"><table className="w-full min-w-[1120px] border-collapse text-left"><thead><tr className="h-12 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600"><th className="w-14 px-4"><input aria-label="Select all accounts on page" checked={allSelected} onChange={onTogglePage} type="checkbox" /></th><th>Account</th><th>Type</th><th>Location</th><th>Professional verification</th><th>Plan</th><th>Status</th><th>Joined</th><th className="px-4 text-right">Action</th></tr></thead><tbody>{rows.map((user) => <tr className="h-[78px] border-t border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50" key={user.user_id}><td className="px-4"><input aria-label={`Select ${user.full_name}`} checked={selected.has(user.user_id)} onChange={() => onToggleRow(user.user_id)} type="checkbox" /></td><td><div className="flex items-center gap-3"><AccountAvatar className="size-10 text-xs" name={user.full_name} sizes="40px" src={user.avatar_url} /><div><Link className="text-sm font-bold text-slate-900 hover:underline" href={`/users/${encodeURIComponent(user.user_id)}`}>{user.full_name}</Link><small className="mt-1 block text-xs text-slate-500">@{user.username} · {user.email}</small></div></div></td><td><RoleBadge type={user.account_type} /></td><td>{[user.city, user.country].filter(Boolean).join(", ") || "—"}</td><td><VerificationStatus user={user} /></td><td className="capitalize">{user.subscription_plan}</td><td><Badge tone={user.status === "active" ? "success" : user.status === "suspended" ? "danger" : "warning"}>{user.status.replaceAll("_", " ")}</Badge></td><td>{formatDate(user.created_at)}</td><td className="px-4 text-right"><Link className="font-bold text-[#8A6A00]" href={`/users/${encodeURIComponent(user.user_id)}`}>Review →</Link></td></tr>)}</tbody></table></div>; }
function VerificationStatus({ user }: { user: AdminUserListItem }) { if (!verificationAccountTypes.has(user.account_type)) return <span className="text-xs text-slate-400">Not required</span>; if (user.professionally_verified) return <Badge tone="success">Verified</Badge>; if (user.pending_verification) return <Badge tone="warning">Pending</Badge>; return <Badge>Unverified</Badge>; }
function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) { const styles = { neutral: "bg-slate-100 text-slate-600", success: "bg-emerald-100 text-emerald-700", warning: "bg-amber-100 text-amber-700", danger: "bg-red-100 text-red-700" }; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${styles[tone]}`}>{children}</span>; }
function RoleBadge({ type }: { type: AccountType }) { return <span className="rounded-full bg-[#F0F4FA] px-2.5 py-1 text-[11px] font-bold capitalize text-[#162A5C]">{type}</span>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)); }
