"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminLiveData, AdminLiveStream } from "@/types/admin-live.types";
import type { ApiEnvelope } from "@/types/admin-user.types";
import { AccountAvatar } from "./AccountAvatar";
import { ConfirmationModal } from "./ConfirmationModal";
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-video place-items-center bg-[#050A1A] text-sm text-slate-300">
      Loading live player…
    </div>
  ),
});
type Action =
  "end_broadcast" | "cancel_broadcast" | "disable_chat" | "enable_chat";
export function LiveOperationsPage() {
  const [data, setData] = useState<AdminLiveData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [access, setAccess] = useState("all"),
    [open, setOpen] = useState<string | null>(null),
    [watching, setWatching] = useState<string | null>(null),
    [pending, setPending] = useState<{
      stream: AdminLiveStream;
      action: Action;
    } | null>(null),
    [reason, setReason] = useState(""),
    [acting, setActing] = useState(false),
    [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/content/live", {
          cache: "no-store",
        }),
        payload = await response.json();
      if (!response.ok || !payload.success)
        throw new Error(
          payload.error?.message ?? "Live broadcasts could not be loaded.",
        );
      setData((payload as ApiEnvelope<AdminLiveData>).data);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Live broadcasts could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [load]);
  const items = useMemo(
    () =>
      data?.items.filter((item) => {
        const term = search.trim().toLowerCase();
        return (
          (status === "all" || item.status === status) &&
          (access === "all" || item.access_type === access) &&
          (!term ||
            [
              item.title,
              item.stream_id,
              item.match.team_home,
              item.match.team_away,
              item.broadcaster?.full_name,
              item.country,
            ].some((value) => value?.toLowerCase().includes(term)))
        );
      }) ?? [],
    [access, data, search, status],
  );
  function choose(stream: AdminLiveStream, action: Action) {
    setPending({ stream, action });
    setReason("");
    setActionError(null);
  }
  async function act() {
    if (!pending || reason.trim().length < 5) return;
    setActing(true);
    setActionError(null);
    try {
      const response = await fetch("/api/admin/content/live/actions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf(),
          },
          body: JSON.stringify({
            stream_id: pending.stream.stream_id,
            action: pending.action,
            reason: reason.trim(),
          }),
        }),
        payload = await response.json();
      if (!response.ok || !payload.success)
        throw new Error(payload.error?.message ?? "Broadcast action failed.");
      setPending(null);
      setWatching(null);
      await load();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Broadcast action failed.",
      );
    } finally {
      setActing(false);
    }
  }
  if (loading && !data)
    return <State text="Loading live broadcast operations…" />;
  if (error && !data) return <State text={error} button={load} />;
  if (!data) return null;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <Hero updated={data.generated_at} refresh={load} />
      {error ? <Notice>Latest refresh failed: {error}</Notice> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
        <Metric label="All broadcasts" value={data.summary.total} />
        <Metric label="Live now" value={data.summary.live} live />
        <Metric label="Scheduled" value={data.summary.scheduled} />
        <Metric label="Ending" value={data.summary.ending} warn />
        <Metric label="Archived" value={data.summary.archived} />
        <Metric label="Cancelled" value={data.summary.cancelled} />
        <Metric label="Watching now" value={data.summary.current_viewers} />
        <Metric label="Reports" value={data.summary.open_reports} danger />
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px]">
        <Field label="Search broadcasts">
          <input
            className="control"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Match, broadcaster, country, stream ID…"
            type="search"
            value={search}
          />
        </Field>
        <Field label="Lifecycle">
          <select
            className="control"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">All states</option>
            {[
              "live",
              "scheduled",
              "pre_live",
              "ending",
              "archived",
              "cancelled",
            ].map((value) => (
              <option key={value} value={value}>
                {friendly(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Access">
          <select
            className="control"
            onChange={(event) => setAccess(event.target.value)}
            value={access}
          >
            <option value="all">All access</option>
            <option value="public">Public</option>
            <option value="followers_only">Followers only</option>
          </select>
        </Field>
        <p className="m-0 text-sm text-slate-500 md:col-span-3">
          {items.length} broadcasts match · operational data refreshes every 30
          seconds
        </p>
      </section>
      <section className="space-y-5">
        {items.map((item) => (
          <StreamCard
            item={item}
            expanded={open === item.stream_id}
            watching={watching === item.stream_id}
            key={item.stream_id}
            toggle={() =>
              setOpen(open === item.stream_id ? null : item.stream_id)
            }
            watch={() =>
              setWatching(watching === item.stream_id ? null : item.stream_id)
            }
            choose={(action) => choose(item, action)}
          />
        ))}
      </section>
      {!items.length ? (
        <State text="No broadcasts match these filters." />
      ) : null}
      <ConfirmationModal
        confirmLabel={pending ? copy[pending.action].label : "Confirm"}
        description={
          pending
            ? `${copy[pending.action].description} Broadcast: ${pending.stream.title}.`
            : ""
        }
        disabled={reason.trim().length < 5}
        error={actionError}
        loading={acting}
        onCancel={() => {
          if (!acting) setPending(null);
        }}
        onConfirm={() => void act()}
        open={Boolean(pending)}
        title={
          pending ? copy[pending.action].title : "Confirm broadcast action"
        }
        tone={
          pending &&
          ["end_broadcast", "cancel_broadcast"].includes(pending.action)
            ? "danger"
            : "warning"
        }
      >
        <Field label="Administrative reason">
          <textarea
            autoFocus
            className="min-h-28 rounded-xl border border-slate-300 p-3 text-base font-normal"
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain the safety or operational reason"
            value={reason}
          />
        </Field>
      </ConfirmationModal>
    </div>
  );
}
function StreamCard({
  item,
  expanded,
  watching,
  toggle,
  watch,
  choose,
}: {
  item: AdminLiveStream;
  expanded: boolean;
  watching: boolean;
  toggle: () => void;
  watch: () => void;
  choose: (action: Action) => void;
}) {
  const playable =
      item.status === "archived" ? item.recording_url : item.playback_url,
    playbackId =
      item.status === "archived"
        ? item.recording_playback_id
        : item.playback_id,
    poster =
      item.thumbnail_url ??
      (playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
        : undefined);
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${item.status === "live" ? "border-red-300" : "border-slate-200"}`}
    >
      <div className="grid lg:grid-cols-[minmax(340px,520px)_1fr]">
        <div className="relative aspect-video overflow-hidden bg-[#050A1A]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#243B6B,#050A1A)]" />
          {poster && !watching ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url(${poster})` }}
            />
          ) : null}
          {watching && playable ? (
            <MuxPlayer
              accentColor="#E6B800"
              autoPlay
              className="absolute inset-0 h-full w-full"
              metadata={{
                video_id: item.stream_id,
                video_title: item.title,
                viewer_user_id: "provplay-admin",
              }}
              playbackId={
                item.access_type === "public"
                  ? (playbackId ?? undefined)
                  : undefined
              }
              poster={poster}
              preload="metadata"
              src={item.access_type === "public" ? undefined : playable}
              streamType={item.status === "live" ? "live" : "on-demand"}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-5 text-center text-white">
              <div>
                <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-black/60 text-xl">
                  {item.status === "live" ? "●" : "▶"}
                </span>
                <strong className="block text-base">
                  {playable
                    ? item.status === "live"
                      ? "Live playback ready"
                      : "Recording ready"
                    : "Playback unavailable"}
                </strong>
              </div>
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge value={item.status} />
            <Badge value={item.access_type} />
          </div>
          {playable ? (
            <button
              className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-4 py-2 text-sm font-bold text-white"
              onClick={watch}
            >
              {watching
                ? "Close player"
                : item.status === "live"
                  ? "Watch live"
                  : "Watch recording"}
            </button>
          ) : null}
        </div>
        <div className="p-5 lg:p-6">
          <div className="flex items-start gap-3">
            <AccountAvatar
              className="size-12 text-sm"
              name={item.broadcaster?.full_name ?? "Unknown"}
              sizes="48px"
              src={item.broadcaster?.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-xl text-[#0F1F42]">{item.title}</h2>
              {item.broadcaster ? (
                <Link
                  className="mt-1 block text-sm text-slate-500 hover:underline"
                  href={`/users/${item.broadcaster.user_id}`}
                >
                  {item.broadcaster.full_name} ·{" "}
                  {friendly(item.broadcaster.account_type)}
                </Link>
              ) : (
                <span className="text-sm text-red-700">
                  Broadcaster account unavailable
                </span>
              )}
            </div>
          </div>
          <div className="my-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <strong className="text-lg">{item.match.team_home}</strong>
              <span className="mt-1 block text-sm text-slate-500">Home</span>
            </div>
            <strong className="text-2xl tabular-nums">
              {item.match.score_home} – {item.match.score_away}
            </strong>
            <div className="text-right">
              <strong className="text-lg">{item.match.team_away}</strong>
              <span className="mt-1 block text-sm text-slate-500">Away</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Small label="Current" value={item.audience.current} />
            <Small label="Peak" value={item.audience.peak} />
            <Small label="Unique" value={item.audience.unique} />
            <Small label="Duration" value={duration(item.duration_seconds)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="button button--secondary" onClick={toggle}>
              {expanded ? "Close operations" : "Open operations"}
            </button>
            {item.status === "live" ? (
              <button
                className="button button--secondary"
                onClick={() =>
                  choose(item.allow_chat ? "disable_chat" : "enable_chat")
                }
              >
                {item.allow_chat ? "Disable chat" : "Enable chat"}
              </button>
            ) : null}
            {item.status === "live" ? (
              <button
                className="button bg-red-700 text-white"
                onClick={() => choose("end_broadcast")}
              >
                End broadcast
              </button>
            ) : null}
            {["scheduled", "pre_live"].includes(item.status) ? (
              <button
                className="button bg-red-700 text-white"
                onClick={() => choose("cancel_broadcast")}
              >
                Cancel broadcast
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {expanded ? <Operations item={item} /> : null}
    </article>
  );
}
function Operations({ item }: { item: AdminLiveStream }) {
  return (
    <div className="space-y-5 border-t border-slate-200 bg-slate-50 p-5 lg:p-7">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Info
          label="Playback health"
          value={friendly(item.health.state)}
          tone={item.health.state === "healthy" ? "green" : "amber"}
        />
        <Info
          label="Mux provisioned"
          value={yes(item.health.mux_provisioned)}
        />
        <Info
          label="Recording"
          value={
            item.is_recorded
              ? item.health.recording_ready
                ? "Ready"
                : "Pending"
              : "Disabled"
          }
        />
        <Info label="Source" value={friendly(item.broadcast_source)} />
        <Info
          label="Average watch"
          value={duration(item.audience.average_watch_seconds)}
        />
        <Info
          label="Chat messages"
          value={item.chat.message_count.toLocaleString()}
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Broadcast details">
          <Rows
            values={{
              "Stream ID": item.stream_id,
              Scheduled: date(item.scheduled_start),
              Started: item.started_at ? date(item.started_at) : "—",
              Ended: item.ended_at ? date(item.ended_at) : "—",
              Country: item.country ?? "—",
              "Match type": friendly(item.match.type),
              Access: friendly(item.access_type),
              "Slow mode": item.chat.slow_mode_seconds
                ? `${item.chat.slow_mode_seconds}s`
                : "Off",
              "Viewer sessions": item.audience.viewer_sessions,
              Reminders: item.audience.reminder_count,
            }}
          />
        </Panel>
        <Panel title={`Reports (${item.reports.length})`}>
          {item.reports.length ? (
            item.reports.map((report) => (
              <div
                className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm"
                key={report.report_id}
              >
                <strong>{friendly(report.reason)}</strong>
                <span className="block text-slate-500">
                  {date(report.created_at)} · {report.status}
                </span>
                {report.details ? (
                  <p className="mb-0 mt-2 text-slate-700">{report.details}</p>
                ) : null}
              </div>
            ))
          ) : (
            <Empty text="No reports received." />
          )}
        </Panel>
        <Panel title="Recent live chat">
          {item.chat.recent_messages.length ? (
            item.chat.recent_messages.map((message) => (
              <div
                className="border-b border-slate-100 py-2 text-sm"
                key={message.message_id}
              >
                <p className="m-0 text-slate-800">{message.text}</p>
                <span className="text-xs text-slate-500">
                  {message.sender_user_id} · {date(message.created_at)}
                </span>
              </div>
            ))
          ) : (
            <Empty text="No live chat messages." />
          )}
        </Panel>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Streamer moderation history">
          {item.moderation_history.length ? (
            item.moderation_history.map((event) => (
              <History
                key={event.event_id}
                action={event.action}
                actor={event.actor_user_id}
                at={event.created_at}
                reason={event.reason}
              />
            ))
          ) : (
            <Empty text="No streamer moderation events." />
          )}
        </Panel>
        <Panel title="Administrative audit history">
          {item.admin_history.length ? (
            item.admin_history.map((event) => (
              <History
                key={event.action_id}
                action={event.action}
                actor={event.admin_id}
                at={event.created_at}
                reason={event.reason}
              />
            ))
          ) : (
            <Empty text="No administrative interventions." />
          )}
        </Panel>
      </section>
    </div>
  );
}
const copy: Record<
  Action,
  { title: string; description: string; label: string }
> = {
  end_broadcast: {
    title: "End this live broadcast?",
    description:
      "Mux ingest will be completed immediately, every active viewer session will close, and recording processing will begin when enabled.",
    label: "End broadcast",
  },
  cancel_broadcast: {
    title: "Cancel this scheduled broadcast?",
    description:
      "The broadcast will no longer be available to start and any provisioned Mux stream will be disabled.",
    label: "Cancel broadcast",
  },
  disable_chat: {
    title: "Disable live chat?",
    description:
      "Viewers can continue watching, but new chat participation will be disabled for this broadcast.",
    label: "Disable chat",
  },
  enable_chat: {
    title: "Enable live chat?",
    description:
      "Viewers will regain access to live text chat for this broadcast.",
    label: "Enable chat",
  },
};
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
          Live match operations
        </p>
        <h1 className="mb-2 mt-2 text-3xl font-extrabold sm:text-4xl">
          Live broadcasts
        </h1>
        <p className="m-0 max-w-3xl text-base leading-7 text-slate-300">
          Watch every active ProvPlay broadcast and oversee schedules, Mux
          playback, audience health, recordings, reports, chat, and audited
          interventions.
        </p>
        <p className="mb-0 mt-3 text-sm text-slate-400">
          Updated {date(updated)}
        </p>
      </div>
      <button className="button button--primary" onClick={() => void refresh()}>
        Refresh broadcasts
      </button>
    </header>
  );
}
function Metric({
  label,
  value,
  live = false,
  danger = false,
  warn = false,
}: {
  label: string;
  value: number;
  live?: boolean;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${live && value ? "border-red-300" : danger && value ? "border-red-200" : warn && value ? "border-amber-300" : "border-slate-200"}`}
    >
      <strong
        className={`block text-2xl ${live && value ? "text-red-700" : "text-[#0F1F42]"}`}
      >
        {value.toLocaleString()}
      </strong>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
function Small({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <strong className="block text-lg text-[#0F1F42]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </strong>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
function Info({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber";
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
    >
      <span className="block text-sm text-slate-500">{label}</span>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mt-0 text-lg">{title}</h3>
      {children}
    </div>
  );
}
function Rows({ values }: { values: Record<string, string | number> }) {
  return (
    <div className="space-y-2">
      {Object.entries(values).map(([label, value]) => (
        <div
          className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm"
          key={label}
        >
          <span className="text-slate-500">{label}</span>
          <strong className="text-right">{value}</strong>
        </div>
      ))}
    </div>
  );
}
function History({
  action,
  actor,
  at,
  reason,
}: {
  action: string;
  actor: string;
  at: string;
  reason: string | null;
}) {
  return (
    <div className="mb-3 rounded-xl border border-slate-200 p-3 text-sm">
      <div className="flex justify-between gap-3">
        <strong>{friendly(action)}</strong>
        <span className="text-slate-500">{date(at)}</span>
      </div>
      <span className="mt-1 block text-slate-500">Actor: {actor}</span>
      {reason ? <p className="mb-0 mt-2">{reason}</p> : null}
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
function Badge({ value }: { value: string }) {
  const hot = value === "live",
    ok = value === "archived";
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold backdrop-blur ${hot ? "bg-red-600 text-white" : ok ? "bg-emerald-100 text-emerald-800" : "bg-black/65 text-white"}`}
    >
      {friendly(value)}
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
function Empty({ text }: { text: string }) {
  return (
    <p className="m-0 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
      {text}
    </p>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-base">
      {children}
    </div>
  );
}
function friendly(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function date(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600),
    minutes = Math.floor((seconds % 3600) / 60),
    rest = Math.floor(seconds % 60);
  return hours
    ? `${hours}h ${minutes}m`
    : `${minutes}:${String(rest).padStart(2, "0")}`;
}
function yes(value: boolean) {
  return value ? "Yes" : "No";
}
function csrf() {
  return (
    document.cookie.match(/(?:^|; )provplay_admin_csrf=([^;]+)/)?.[1] ?? ""
  );
}
