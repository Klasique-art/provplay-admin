"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AiRatingData, AiRatingItem } from "@/types/admin-ai-rating.types";
import type { ApiEnvelope, AdminUserDetail } from "@/types/admin-user.types";
import { AccountAvatar } from "./AccountAvatar";
import { ConfirmationModal } from "./ConfirmationModal";
import { HighlightVideoCard } from "./HighlightVideoCard";
export function AiRatingsPage() {
  const [data, setData] = useState<AiRatingData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [version, setVersion] = useState("all"),
    [open, setOpen] = useState<string | null>(null),
    [target, setTarget] = useState<AiRatingItem | null>(null),
    [reason, setReason] = useState(""),
    [acting, setActing] = useState(false),
    [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/content/ai-ratings", {
          cache: "no-store",
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "AI ratings could not be loaded.");
      setData((p as ApiEnvelope<AiRatingData>).data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "AI ratings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const items = useMemo(
    () =>
      data?.items.filter((x) => {
        const q = search.trim().toLowerCase();
        return (
          (status === "all" || x.status === status) &&
          (version === "all" || x.analysis_version === version) &&
          (!q ||
            [
              x.highlight_id,
              x.caption,
              x.owner?.full_name,
              x.owner?.username,
              x.error_code,
            ].some((v) => v?.toLowerCase().includes(q)))
        );
      }) ?? [],
    [data, search, status, version],
  );
  async function retry() {
    if (!target || reason.trim().length < 5) return;
    setActing(true);
    setActionError(null);
    try {
      const r = await fetch("/api/admin/content/ai-ratings/actions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf(),
          },
          body: JSON.stringify({
            highlight_id: target.highlight_id,
            action: "retry",
            reason: reason.trim(),
          }),
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Analysis retry failed.");
      setTarget(null);
      setReason("");
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Analysis retry failed.");
    } finally {
      setActing(false);
    }
  }
  if (loading && !data) return <State text="Loading AI rating operations…" />;
  if (error && !data) return <State text={error} button={load} />;
  if (!data) return null;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <Hero updated={data.generated_at} refresh={load} />
      {error ? <Notice>{error}</Notice> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <Metric label="Requests" value={data.summary.total} />
        <Metric label="Ready" value={data.summary.ready} />
        <Metric label="Processing" value={data.summary.processing} />
        <Metric label="Failed" value={data.summary.failed} danger />
        <Metric label="Cancelled" value={data.summary.cancelled} />
        <Metric label="Success rate" value={`${data.summary.success_rate}%`} />
        <Metric
          label="Average rating"
          value={data.summary.average_score ?? "—"}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
          <Field label="Search">
            <input
              className="control"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Player, highlight, error…"
              value={search}
            />
          </Field>
          <Field label="State">
            <select
              className="control"
              onChange={(e) => setStatus(e.target.value)}
              value={status}
            >
              <option value="all">All states</option>
              {["processing", "ready", "failed", "cancelled"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Model version">
            <select
              className="control"
              onChange={(e) => setVersion(e.target.value)}
              value={version}
            >
              <option value="all">All versions</option>
              {data.versions.map((x) => (
                <option key={x.version}>{x.version}</option>
              ))}
            </select>
          </Field>
          <p className="m-0 text-sm text-slate-500 md:col-span-3">
            {items.length} requests match · retry limit{" "}
            {data.capabilities.retry_limit}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base leading-7 text-amber-950">
          <strong>Appeals status</strong>
          <p className="mb-0 mt-1">
            Formal player AI-rating appeals are not stored by the current
            product. Failures and every retry attempt are fully visible here;
            appeals should not be inferred from support messages.
          </p>
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        {items.map((item) => (
          <RatingCard
            item={item}
            expanded={open === item.highlight_id}
            key={item.highlight_id}
            toggle={() =>
              setOpen(open === item.highlight_id ? null : item.highlight_id)
            }
            retry={() => {
              setTarget(item);
              setReason("");
              setActionError(null);
            }}
          />
        ))}
      </section>
      {!items.length ? (
        <State text="No AI rating requests match these filters." />
      ) : null}
      <ConfirmationModal
        open={Boolean(target)}
        title="Retry AI performance analysis?"
        description="This queues a new attempt through the existing analysis pipeline. The three-retry safety limit still applies and this decision is audited."
        confirmLabel="Queue retry"
        tone="warning"
        disabled={reason.trim().length < 5}
        error={actionError}
        loading={acting}
        onCancel={() => {
          if (!acting) setTarget(null);
        }}
        onConfirm={() => void retry()}
      >
        <Field label="Administrative reason">
          <textarea
            autoFocus
            className="min-h-28 rounded-xl border border-slate-300 p-3 text-base"
            onChange={(e) => setReason(e.target.value)}
            value={reason}
          />
        </Field>
      </ConfirmationModal>
    </div>
  );
}
function RatingCard({
  item,
  expanded,
  toggle,
  retry,
}: {
  item: AiRatingItem;
  expanded: boolean;
  toggle: () => void;
  retry: () => void;
}) {
  const metrics = Object.entries(item.metrics ?? {});
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-5">
        <AccountAvatar className="size-11 text-sm" name={item.owner?.full_name ?? "Unknown"} sizes="44px" src={item.owner?.avatar_url ?? null} />
        <div className="min-w-0 flex-1">
          <Link
            className="font-extrabold text-[#0F1F42] hover:underline"
            href={`/users/${item.owner?.user_id ?? ""}`}
          >
            {item.owner?.full_name ?? "Unknown player"}
          </Link>
          <p className="m-0 truncate text-sm text-slate-500">
            {item.caption || item.highlight_id}
          </p>
        </div>
        <Badge status={item.status} />
        {item.overall !== null ? (
          <strong className="grid size-12 place-items-center rounded-full bg-[#0F1F42] text-lg text-white">
            {item.overall}
          </strong>
        ) : null}
      </div>
      <div className="grid gap-3 border-y border-slate-100 p-5 sm:grid-cols-3">
        <Stat label="Model" value={item.analysis_version ?? "Unreported"} />
        <Stat
          label="Confidence"
          value={
            item.confidence === null ? "Unreported" : `${item.confidence}%`
          }
        />
        <Stat label="Attempts" value={item.attempts.length} />
      </div>
      {metrics.length ? (
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {metrics.map(([k, v]) => (
            <Score key={k} label={friendly(k)} value={v} />
          ))}
        </div>
      ) : null}
      {item.error_message ? (
        <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-900">
          <strong>{item.error_code ?? "Analysis failure"}</strong>
          <p className="mb-0 mt-1">{item.error_message}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 p-5">
        <button className="button button--secondary" onClick={toggle}>
          {expanded ? "Hide full record" : "Open full record"}
        </button>
        {["failed", "cancelled"].includes(item.status) &&
        item.retry_count < 3 ? (
          <button className="button button--primary" onClick={retry}>
            Retry analysis
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-5">
          <HighlightVideoCard
            highlight={asHighlight(item)}
            playerName={item.owner?.full_name ?? "Player"}
          />
          <h3 className="m-0 text-lg">Attempt history</h3>
          <div className="space-y-2">
            {item.attempts.map((a) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
                key={a.history_id}
              >
                <div className="flex justify-between gap-3">
                  <strong>
                    Attempt {a.attempt} · {friendly(a.status)}
                  </strong>
                  <span>{date(a.queued_at)}</span>
                </div>
                {a.error_message ? (
                  <p className="mb-0 mt-2 text-red-700">
                    {a.error_code}: {a.error_message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
function asHighlight(x: AiRatingItem) {
  return {
    highlight_id: x.highlight_id,
    caption: x.caption,
    tags: [],
    visibility: "admin review",
    status: "published",
    created_at: x.requested_at,
    media: x.media,
    thumbnail_url: x.thumbnail_url,
    stats: {},
    ai_rating: {
      status: x.status,
      overall: x.overall,
      metrics: x.metrics,
      confidence: x.confidence,
      analysis_version: x.analysis_version,
    },
  } as unknown as AdminUserDetail["highlights"][number];
}
function Hero({
  updated,
  refresh,
}: {
  updated: string;
  refresh: () => Promise<void>;
}) {
  return (
    <header className="flex flex-col justify-between gap-4 rounded-2xl bg-[#07132F] p-5 text-white lg:flex-row lg:items-end lg:p-7">
      <div>
        <p className="m-0 text-sm font-extrabold uppercase tracking-[.14em] text-[#F0C400]">
          AI performance operations
        </p>
        <h1 className="mb-2 mt-2 text-3xl font-extrabold sm:text-4xl">
          AI player ratings
        </h1>
        <p className="m-0 max-w-3xl text-base leading-7 text-slate-300">
          Monitor every analysis request, output, model version, confidence
          signal, failure, and safe retry.
        </p>
        <p className="mb-0 mt-3 text-sm text-slate-400">
          Updated {date(updated)}
        </p>
      </div>
      <button className="button button--primary" onClick={() => void refresh()}>
        Refresh ratings
      </button>
    </header>
  );
}
function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${danger && Number(value) > 0 ? "border-red-200" : "border-slate-200"}`}
    >
      <strong
        className={`block text-2xl ${danger && Number(value) > 0 ? "text-red-700" : "text-[#0F1F42]"}`}
      >
        {value}
      </strong>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="block text-sm text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Score({ label, value }: { label: string; value: unknown }) {
  const n = typeof value === "number" ? value : null;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <strong>{label}</strong>
        <span>{String(value)}</span>
      </div>
      {n !== null ? (
        <div className="h-2 rounded bg-slate-100">
          <div
            className="h-2 rounded bg-[#E6B800]"
            style={{ width: `${Math.min(100, Math.max(0, n))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold ${status === "ready" ? "bg-emerald-100 text-emerald-800" : status === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}
    >
      {friendly(status)}
    </span>
  );
}
function State({ text, button }: { text: string; button?: () => void }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-slate-600">
      <div>
        <p>{text}</p>
        {button ? (
          <button className="button button--primary" onClick={button}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-base">
      {children}
    </div>
  );
}
function friendly(x: string) {
  return x.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function date(x: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(x));
}
function csrf() {
  return (
    document.cookie.match(/(?:^|; )provplay_admin_csrf=([^;]+)/)?.[1] ?? ""
  );
}
