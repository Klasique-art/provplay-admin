"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminFixture,
  AdminFixtureData,
} from "@/types/admin-football.types";
import type { ApiEnvelope } from "@/types/admin-user.types";
import { ConfirmationModal } from "./ConfirmationModal";
type Action = "cancel" | "postpone" | "abandon" | "complete" | "correct_result";
export function FixturesOperationsPage() {
  const [data, setData] = useState<AdminFixtureData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [open, setOpen] = useState<string | null>(null),
    [pending, setPending] = useState<{
      fixture: AdminFixture;
      action: Action;
    } | null>(null),
    [reason, setReason] = useState(""),
    [home, setHome] = useState(0),
    [away, setAway] = useState(0),
    [acting, setActing] = useState(false),
    [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/operations/fixtures", {
          cache: "no-store",
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Fixtures could not be loaded.");
      setData((p as ApiEnvelope<AdminFixtureData>).data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Fixtures could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);
  const items = useMemo(
    () =>
      data?.items.filter((x) => {
        const q = search.toLowerCase(),
          home = team(x.home_team),
          away = team(x.away_team);
        return (
          (status === "all" || x.status === status) &&
          (!q ||
            [
              x.fixture_id,
              home,
              away,
              x.home_club?.full_name,
              x.away_club?.full_name,
            ].some((v) => v?.toLowerCase().includes(q)))
        );
      }) ?? [],
    [data, search, status],
  );
  function choose(fixture: AdminFixture, action: Action) {
    setPending({ fixture, action });
    setReason("");
    setActionError(null);
    setHome(num(fixture.result?.homeScore));
    setAway(num(fixture.result?.awayScore));
  }
  async function act() {
    if (!pending || reason.trim().length < 5) return;
    setActing(true);
    try {
      const body: Record<string, unknown> = {
        fixture_id: pending.fixture.fixture_id,
        action: pending.action,
        reason: reason.trim(),
      };
      if (pending.action === "correct_result") {
        body.home_score = home;
        body.away_score = away;
      }
      const r = await fetch("/api/admin/operations/fixtures/actions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf(),
          },
          body: JSON.stringify(body),
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Fixture action failed.");
      setPending(null);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Fixture action failed.");
    } finally {
      setActing(false);
    }
  }
  if (loading && !data) return <State text="Loading fixture operations…" />;
  if (error && !data) return <State text={error} retry={load} />;
  if (!data) return null;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <Hero updated={data.generated_at} refresh={load} />
      {error ? <Notice>{error}</Notice> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-9">
        {Object.entries(data.summary).map(([k, v]) => (
          <Metric
            key={k}
            label={friendly(k)}
            value={v}
            danger={k === "disputed"}
          />
        ))}
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px]">
        <Field label="Search fixtures">
          <input
            className="control"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Team, club, fixture ID…"
            value={search}
          />
        </Field>
        <Field label="Lifecycle">
          <select
            className="control"
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option value="all">All statuses</option>
            {[
              "scheduled",
              "in_progress",
              "awaiting_result",
              "result_disputed",
              "completed",
              "postponed",
              "cancelled",
              "abandoned",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </section>
      <section className="space-y-4">
        {items.map((f) => (
          <FixtureCard
            choose={(a) => choose(f, a)}
            expanded={open === f.fixture_id}
            fixture={f}
            key={f.fixture_id}
            toggle={() => setOpen(open === f.fixture_id ? null : f.fixture_id)}
          />
        ))}
      </section>
      {!items.length ? <State text="No fixtures match these filters." /> : null}
      <ConfirmationModal
        open={Boolean(pending)}
        title={`${friendly(pending?.action ?? "Confirm")} fixture?`}
        description="This override changes the canonical football record and will be preserved in administrative audit history."
        confirmLabel={friendly(pending?.action ?? "Confirm")}
        tone={pending?.action === "correct_result" ? "warning" : "danger"}
        disabled={reason.trim().length < 5}
        error={actionError}
        loading={acting}
        onCancel={() => {
          if (!acting) setPending(null);
        }}
        onConfirm={() => void act()}
      >
        {pending?.action === "correct_result" ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Field label="Home score">
              <input
                className="control"
                min={0}
                max={99}
                onChange={(e) => setHome(Number(e.target.value))}
                type="number"
                value={home}
              />
            </Field>
            <Field label="Away score">
              <input
                className="control"
                min={0}
                max={99}
                onChange={(e) => setAway(Number(e.target.value))}
                type="number"
                value={away}
              />
            </Field>
          </div>
        ) : null}
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
function FixtureCard({
  fixture: f,
  expanded,
  toggle,
  choose,
}: {
  fixture: AdminFixture;
  expanded: boolean;
  toggle: () => void;
  choose: (a: Action) => void;
}) {
  const result = f.result,
    hs = result ? num(result.homeScore) : null,
    as = result ? num(result.awayScore) : null;
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid items-center gap-4 p-5 lg:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <strong className="text-lg">{team(f.home_team)}</strong>
          <span className="block text-sm text-slate-500">
            {f.home_club?.full_name ?? "Home"}
          </span>
        </div>
        <div className="text-center">
          <div className="text-3xl font-extrabold text-[#0F1F42]">
            {hs === null ? "–" : `${hs} – ${as}`}
          </div>
          <Badge value={f.status} />
        </div>
        <div className="lg:text-right">
          <strong className="text-lg">{team(f.away_team)}</strong>
          <span className="block text-sm text-slate-500">
            {f.away_club?.full_name ?? "External opponent"}
          </span>
        </div>
        <button className="button button--secondary" onClick={toggle}>
          {expanded ? "Close" : "Open operations"}
        </button>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
        <span>{date(f.terms.kickoffAt)}</span>
        <span>{venue(f.terms.venue)}</span>
        <span>{f.terms.matchFormat}</span>
        <span>{friendly(f.confirmation_status)}</span>
        <span>{friendly(f.visibility)}</span>
      </div>
      {expanded ? (
        <div className="space-y-5 border-t border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Agreement and terms">
              <Rows
                values={{
                  ID: f.fixture_id,
                  Type: friendly(f.type),
                  Source: friendly(f.source),
                  Duration: `${f.terms.durationMinutes} minutes`,
                  Designation: friendly(f.terms.designationForRequester),
                  Started: f.started_at ? date(f.started_at) : "—",
                  Ended: f.ended_at ? date(f.ended_at) : "—",
                }}
              />
              <Json
                value={{
                  compatibility: f.compatibility,
                  conditions: f.terms.conditions,
                  request: f.request,
                  proposals: f.proposals,
                }}
              />
            </Panel>
            <Panel title="Squads and availability">
              <Rows
                values={{
                  Squads: f.squads.length,
                  Submitted: f.squads.filter((x) => x.status === "submitted")
                    .length,
                  Availability_records: f.availability.length,
                  Available: f.availability.filter(
                    (x) => x.status === "available",
                  ).length,
                }}
              />
              <Json
                value={{ squads: f.squads, availability: f.availability }}
              />
            </Panel>
            <Panel title="Administrative controls">
              <div className="flex flex-wrap gap-2">
                <button
                  className="button button--primary"
                  onClick={() => choose("correct_result")}
                >
                  Correct result
                </button>
                {f.status !== "completed" ? (
                  <button
                    className="button button--secondary"
                    onClick={() => choose("complete")}
                  >
                    Mark completed
                  </button>
                ) : null}
                {!["cancelled", "completed"].includes(f.status) ? (
                  <>
                    <button
                      className="button button--secondary"
                      onClick={() => choose("postpone")}
                    >
                      Postpone
                    </button>
                    <button
                      className="button button--secondary"
                      onClick={() => choose("cancel")}
                    >
                      Cancel
                    </button>
                    <button
                      className="button button--secondary"
                      onClick={() => choose("abandon")}
                    >
                      Abandon
                    </button>
                  </>
                ) : null}
              </div>
              <h4>Admin audit</h4>
              <Json value={f.admin_history} />
            </Panel>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title={`Match events (${f.events.length})`}>
              <Timeline rows={f.events} />
            </Panel>
            <Panel title={`Change requests (${f.change_requests.length})`}>
              <Timeline rows={f.change_requests} />
            </Panel>
            <Panel title={`Fixture activity (${f.activity.length})`}>
              <Timeline rows={f.activity} />
            </Panel>
          </div>
          {result ? (
            <Panel title="Canonical result record">
              <Json value={result} />
            </Panel>
          ) : null}
        </div>
      ) : null}
    </article>
  );
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
          Football operations
        </p>
        <h1 className="mb-2 mt-2 text-3xl font-extrabold sm:text-4xl">
          Fixtures and matches
        </h1>
        <p className="m-0 max-w-3xl text-base leading-7 text-slate-300">
          Oversee fixture agreements, proposals, teams, squads, availability,
          match events, results, disputes, changes, cancellations, and audited
          corrections.
        </p>
        <p className="mb-0 mt-3 text-sm text-slate-400">
          Updated {date(updated)}
        </p>
      </div>
      <button className="button button--primary" onClick={() => void refresh()}>
        Refresh fixtures
      </button>
    </header>
  );
}
function Timeline({ rows }: { rows: Array<Record<string, unknown>> }) {
  return rows.length ? (
    <div className="space-y-2">
      {rows.map((x, i) => (
        <details
          className="rounded-lg border border-slate-200 p-3 text-sm"
          key={String(x.eventId ?? x.changeId ?? x.activityId ?? i)}
        >
          <summary className="cursor-pointer font-bold">
            {friendly(String(x.type ?? x.kind ?? x.event ?? "Record"))}{" "}
            {x.minute !== undefined ? `· ${x.minute}'` : ""}
          </summary>
          <Json value={x} />
        </details>
      ))}
    </div>
  ) : (
    <Empty text="No records." />
  );
}
function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${danger && value ? "border-red-300" : "border-slate-200"}`}
    >
      <strong className="block text-2xl">{value}</strong>
      <span className="text-sm text-slate-500">{label}</span>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mt-0 text-lg">{title}</h3>
      {children}
    </div>
  );
}
function Rows({ values }: { values: Record<string, string | number> }) {
  return (
    <div>
      {Object.entries(values).map(([k, v]) => (
        <div
          className="flex justify-between gap-3 border-b py-2 text-sm"
          key={k}
        >
          <span>{friendly(k)}</span>
          <strong className="text-right">{v}</strong>
        </div>
      ))}
    </div>
  );
}
function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
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
    <label className="grid gap-2 text-sm font-bold">
      {label}
      {children}
    </label>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
      {friendly(value)}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="m-0 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
      {text}
    </p>
  );
}
function State({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <p>{text}</p>
        {retry ? (
          <button className="button button--primary" onClick={retry}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
      {children}
    </div>
  );
}
function team(x: Record<string, unknown> | null) {
  return String(x?.name ?? x?.teamName ?? x?.shortName ?? "Unnamed team");
}
function venue(x: Record<string, unknown>) {
  return [x.name, x.city, x.country].filter(Boolean).join(", ") || "Venue TBD";
}
function num(x: unknown) {
  return typeof x === "number" ? x : Number(x ?? 0);
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
