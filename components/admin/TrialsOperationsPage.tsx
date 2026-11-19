"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminTrial,
  AdminTrialData,
  TrialApplication,
} from "@/types/admin-football.types";
import type { ApiEnvelope } from "@/types/admin-user.types";
import { AccountAvatar } from "./AccountAvatar";
import { ConfirmationModal } from "./ConfirmationModal";
type Pending = {
  target: "trial" | "application";
  id: string;
  name: string;
  action: string;
};
export function TrialsOperationsPage() {
  const [data, setData] = useState<AdminTrialData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [open, setOpen] = useState<string | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [reason, setReason] = useState(""),
    [acting, setActing] = useState(false),
    [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/opportunities/trials", {
          cache: "no-store",
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Trials could not be loaded.");
      setData((p as ApiEnvelope<AdminTrialData>).data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trials could not be loaded.");
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
        const q = search.toLowerCase();
        return (
          (status === "all" || x.status === status) &&
          (!q ||
            [
              x.title,
              x.city,
              x.country,
              x.organizer?.full_name,
              x.trial_id,
            ].some((v) => v?.toLowerCase().includes(q)))
        );
      }) ?? [],
    [data, search, status],
  );
  function choose(p: Pending) {
    setPending(p);
    setReason("");
    setActionError(null);
  }
  async function act() {
    if (!pending || reason.trim().length < 5) return;
    setActing(true);
    try {
      const r = await fetch("/api/admin/opportunities/trials/actions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf(),
          },
          body: JSON.stringify({
            target_type: pending.target,
            target_id: pending.id,
            action: pending.action,
            reason: reason.trim(),
          }),
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Trial action failed.");
      setPending(null);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Trial action failed.");
    } finally {
      setActing(false);
    }
  }
  if (loading && !data) return <State text="Loading trial operations…" />;
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
            warn={["paused", "awaiting_review"].includes(k)}
          />
        ))}
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px]">
        <Field label="Search trials">
          <input
            className="control"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, organizer, city, trial ID…"
            value={search}
          />
        </Field>
        <Field label="Status">
          <select
            className="control"
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option value="all">All statuses</option>
            {[
              "draft",
              "open",
              "paused",
              "closed",
              "cancelled",
              "completed",
              "archived",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </section>
      {items.map((t) => (
        <TrialCard
          choose={choose}
          expanded={open === t.trial_id}
          key={t.trial_id}
          trial={t}
          toggle={() => setOpen(open === t.trial_id ? null : t.trial_id)}
        />
      ))}
      {!items.length ? <State text="No trials match these filters." /> : null}
      <ConfirmationModal
        open={Boolean(pending)}
        title={`${friendly(pending?.action ?? "Confirm")} ${pending?.target ?? "record"}?`}
        description={`${pending?.name ?? "This record"} will be updated immediately and the reason stored in the administrative audit history.`}
        confirmLabel={friendly(pending?.action ?? "Confirm")}
        tone={
          ["cancel", "archive", "declined", "no_show"].includes(
            pending?.action ?? "",
          )
            ? "danger"
            : "warning"
        }
        disabled={reason.trim().length < 5}
        error={actionError}
        loading={acting}
        onCancel={() => {
          if (!acting) setPending(null);
        }}
        onConfirm={() => void act()}
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
function TrialCard({
  trial,
  expanded,
  toggle,
  choose,
}: {
  trial: AdminTrial;
  expanded: boolean;
  toggle: () => void;
  choose: (p: Pending) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <AccountAvatar
          className="size-14 text-base"
          name={trial.organizer?.full_name ?? "Unknown"}
          sizes="56px"
          src={trial.organizer?.avatar_url}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge value={trial.status} />
            <Badge value={trial.age_group} />
            {!trial.is_public ? <Badge value="private" /> : null}
          </div>
          <h2 className="mb-1 mt-2 text-xl">{trial.title}</h2>
          <p className="m-0 text-sm text-slate-500">
            {trial.organizer?.full_name ?? "Unknown organizer"} · {trial.city},{" "}
            {trial.country} · {date(trial.trial_date)}
          </p>
        </div>
        <Stat label="Applications" value={trial.applications.length} />
        <Stat
          label="Spots"
          value={`${trial.spots_filled}/${trial.spots_total}`}
        />
        <Stat label="Views" value={trial.view_count} />
        <button className="button button--secondary" onClick={toggle}>
          {expanded ? "Close workspace" : "Open workspace"}
        </button>
      </div>
      {expanded ? (
        <div className="space-y-5 border-t border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Opportunity">
              <p className="text-base leading-7">
                {trial.description || "No description."}
              </p>
              <Rows
                values={{
                  Deadline: date(trial.deadline),
                  Positions: trial.positions_sought.join(", ") || "Any",
                  Ages:
                    trial.min_age && trial.max_age
                      ? `${trial.min_age}–${trial.max_age}`
                      : trial.age_group,
                  Fee: trial.entry_fee_usd
                    ? `USD ${trial.entry_fee_usd}`
                    : "Free",
                  Contact: trial.contact_email ?? trial.contact_phone ?? "—",
                }}
              />
            </Panel>
            <Panel title="Requirements">
              <ul className="pl-5">
                {trial.requirements.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {!trial.requirements.length ? (
                <Empty text="No requirements listed." />
              ) : null}
            </Panel>
            <Panel title="Administrative controls">
              <div className="flex flex-wrap gap-2">
                {trial.status === "open" ? (
                  <button
                    className="button button--secondary"
                    onClick={() =>
                      choose({
                        target: "trial",
                        id: trial.trial_id,
                        name: trial.title,
                        action: "pause",
                      })
                    }
                  >
                    Pause
                  </button>
                ) : null}
                {["paused", "closed"].includes(trial.status) ? (
                  <button
                    className="button button--primary"
                    onClick={() =>
                      choose({
                        target: "trial",
                        id: trial.trial_id,
                        name: trial.title,
                        action: "reopen",
                      })
                    }
                  >
                    Reopen
                  </button>
                ) : null}
                <button
                  className="button button--secondary"
                  onClick={() =>
                    choose({
                      target: "trial",
                      id: trial.trial_id,
                      name: trial.title,
                      action: "cancel",
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  className="button button--secondary"
                  onClick={() =>
                    choose({
                      target: "trial",
                      id: trial.trial_id,
                      name: trial.title,
                      action: "archive",
                    })
                  }
                >
                  Archive
                </button>
              </div>
              <h4>Audit history</h4>
              <Audit rows={trial.admin_history} />
            </Panel>
          </div>
          <h3>Applications and onboarding</h3>
          <div className="space-y-3">
            {trial.applications.map((a) => (
              <Application
                application={a}
                choose={choose}
                key={a.application_id}
              />
            ))}
          </div>
          {!trial.applications.length ? (
            <Empty text="No applications received." />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
function Application({
  application: a,
  choose,
}: {
  application: TrialApplication;
  choose: (p: Pending) => void;
}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
        <AccountAvatar
          className="size-11 text-sm"
          name={a.player?.full_name ?? "Unknown"}
          sizes="44px"
          src={a.player?.avatar_url}
        />
        <div className="min-w-0 flex-1">
          <Link
            className="font-bold hover:underline"
            href={`/users/${a.player?.user_id ?? ""}`}
          >
            {a.player?.full_name ?? "Unknown player"}
          </Link>
          <span className="block text-sm text-slate-500">
            {a.position} · applied {date(a.created_at)}
          </span>
        </div>
        <Badge value={a.status} />
        <Badge value={a.payment_status ?? "no payment"} />
      </summary>
      <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-3">
        <Panel title="Application">
          <p>{a.message || "No message."}</p>
          <Rows
            values={{
              Highlights: a.highlight_ids.length,
              Rating: a.rating_given ?? "—",
              Notes: a.organizer_notes ?? "—",
            }}
          />
        </Panel>
        <Panel title="Invitation, assessment and onboarding">
          <Json
            value={{
              invitation: a.invitation,
              assessment: a.assessment,
              onboarding: a.onboarding,
            }}
          />
        </Panel>
        <Panel title="Moderation">
          <div className="flex flex-wrap gap-2">
            {[
              "under_review",
              "shortlisted",
              "invited",
              "declined",
              "attended",
              "no_show",
            ].map((action) => (
              <button
                className="button button--secondary"
                key={action}
                onClick={() =>
                  choose({
                    target: "application",
                    id: a.application_id,
                    name: a.player?.full_name ?? a.application_id,
                    action,
                  })
                }
              >
                {friendly(action)}
              </button>
            ))}
          </div>
          <h4>Audit</h4>
          <Audit rows={a.admin_history} />
        </Panel>
      </div>
    </details>
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
          Football opportunities
        </p>
        <h1 className="mb-2 mt-2 text-3xl font-extrabold sm:text-4xl">
          Trials and applications
        </h1>
        <p className="m-0 max-w-3xl text-base leading-7 text-slate-300">
          Oversee every opportunity, eligibility rule, application, invitation,
          assessment, attendance decision, outcome, and onboarding journey.
        </p>
        <p className="mb-0 mt-3 text-sm text-slate-400">
          Updated {date(updated)}
        </p>
      </div>
      <button className="button button--primary" onClick={() => void refresh()}>
        Refresh trials
      </button>
    </header>
  );
}
function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${warn && value ? "border-amber-300" : "border-slate-200"}`}
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
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-20 text-center">
      <strong className="block text-lg">{value}</strong>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
function Rows({ values }: { values: Record<string, string | number> }) {
  return (
    <div>
      {Object.entries(values).map(([k, v]) => (
        <div
          className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm"
          key={k}
        >
          <span>{k}</span>
          <strong className="text-right">{v}</strong>
        </div>
      ))}
    </div>
  );
}
function Audit({ rows }: { rows: Array<Record<string, unknown>> }) {
  return rows.length ? (
    <Json value={rows} />
  ) : (
    <Empty text="No admin interventions." />
  );
}
function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
      {friendly(value)}
    </span>
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
