"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountAvatar } from "./AccountAvatar";
import { ConfirmationModal } from "./ConfirmationModal";
type Person = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  account_type: string;
};
type Candidate = {
  candidate_id: string;
  player: Person | null;
  stage: string;
  updated_at: string;
  [key: string]: unknown;
};
type Need = {
  need_id: string;
  kind: string;
  owner: Person | null;
  title: string;
  positions: string[];
  target_count: number | null;
  criteria: Record<string, unknown>;
  priority: string;
  status: string;
  notes: string | null;
  outcome: string | null;
  candidates: Candidate[];
  activity: unknown[];
  admin_history: unknown[];
  created_at: string;
  updated_at: string;
};
type Data = {
  generated_at: string;
  summary: Record<string, number>;
  items: Need[];
};
type Pending = {
  type: "need" | "candidate";
  id: string;
  name: string;
  action: string;
};
export function RecruitmentOperationsPage() {
  const [data, setData] = useState<Data | null>(null),
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
      const r = await fetch("/api/admin/operations/recruitment", {
          cache: "no-store",
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(
          p.error?.message ?? "Recruitment records could not be loaded.",
        );
      setData(p.data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Recruitment records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  const items = useMemo(
    () =>
      data?.items.filter((x) => {
        const q = search.toLowerCase();
        return (
          (status === "all" || x.status === status) &&
          (!q ||
            [x.title, x.need_id, x.owner?.full_name, ...x.positions].some((v) =>
              v?.toLowerCase().includes(q),
            ))
        );
      }) ?? [],
    [data, search, status],
  );
  async function act() {
    if (!pending || reason.trim().length < 5) return;
    setActing(true);
    try {
      const r = await fetch("/api/admin/operations/recruitment/actions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf(),
          },
          body: JSON.stringify({
            target_type: pending.type,
            target_id: pending.id,
            action: pending.action,
            reason: reason.trim(),
          }),
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Recruitment action failed.");
      setPending(null);
      await load();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Recruitment action failed.",
      );
    } finally {
      setActing(false);
    }
  }
  if (loading && !data) return <State text="Loading recruitment operations…" />;
  if (error && !data) return <State text={error} />;
  if (!data) return null;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <Hero updated={data.generated_at} refresh={load} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
        {Object.entries(data.summary).map(([k, v]) => (
          <Metric key={k} label={friendly(k)} value={v} />
        ))}
      </section>
      <section className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px]">
        <Field label="Search">
          <input
            className="control"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Need, club, coach, position…"
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
            {["active", "paused", "filled", "cancelled"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </section>
      {items.map((n) => (
        <article
          className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          key={n.need_id}
        >
          <div className="flex flex-wrap items-center gap-4 p-5">
            <AccountAvatar
              className="size-12 text-sm"
              name={n.owner?.full_name ?? "Unknown"}
              sizes="48px"
              src={n.owner?.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <div className="flex gap-2">
                <Badge value={n.kind} />
                <Badge value={n.status} />
                <Badge value={n.priority} />
              </div>
              <h2 className="mb-1 mt-2 text-xl">{n.title}</h2>
              <p className="m-0 text-sm text-slate-500">
                {n.owner?.full_name ?? "Unknown owner"} ·{" "}
                {n.positions.join(", ")} · {n.candidates.length} candidates
              </p>
            </div>
            <button
              className="button button--secondary"
              onClick={() => setOpen(open === n.need_id ? null : n.need_id)}
            >
              {open === n.need_id ? "Close" : "Open pipeline"}
            </button>
          </div>
          {open === n.need_id ? (
            <div className="space-y-5 border-t bg-slate-50 p-5">
              <div className="grid gap-5 lg:grid-cols-3">
                <Panel title="Need and criteria">
                  <p>{n.notes || "No internal notes."}</p>
                  <Json
                    value={{
                      target_count: n.target_count,
                      criteria: n.criteria,
                      outcome: n.outcome,
                    }}
                  />
                </Panel>
                <Panel title="Need controls">
                  <div className="flex flex-wrap gap-2">
                    {["active", "paused", "filled", "cancelled"].map((a) => (
                      <button
                        className="button button--secondary"
                        key={a}
                        onClick={() => {
                          setPending({
                            type: "need",
                            id: n.need_id,
                            name: n.title,
                            action: a,
                          });
                          setReason("");
                        }}
                      >
                        {friendly(a)}
                      </button>
                    ))}
                  </div>
                  <h4>Audit</h4>
                  <Json value={n.admin_history} />
                </Panel>
                <Panel title="Workflow activity">
                  <Json value={n.activity} />
                </Panel>
              </div>
              <h3>Candidate pipeline</h3>
              <div className="space-y-3">
                {n.candidates.map((c) => (
                  <div
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4"
                    key={c.candidate_id}
                  >
                    <AccountAvatar
                      className="size-11 text-sm"
                      name={c.player?.full_name ?? "Unknown"}
                      sizes="44px"
                      src={c.player?.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        className="font-bold hover:underline"
                        href={`/users/${c.player?.user_id ?? ""}`}
                      >
                        {c.player?.full_name ?? "Unknown player"}
                      </Link>
                      <span className="block text-sm text-slate-500">
                        Updated {date(c.updated_at)}
                      </span>
                    </div>
                    <Badge value={c.stage} />
                    <details>
                      <summary className="button button--secondary">
                        Inspect
                      </summary>
                      <Json value={c} />
                    </details>
                    <select
                      className="control w-auto"
                      onChange={(e) => {
                        if (e.target.value) {
                          setPending({
                            type: "candidate",
                            id: c.candidate_id,
                            name: c.player?.full_name ?? c.candidate_id,
                            action: e.target.value,
                          });
                          setReason("");
                        }
                      }}
                      value=""
                    >
                      <option value="">Move stage…</option>
                      {[
                        "watching",
                        "shortlisted",
                        "contacted",
                        "trial_invited",
                        "onboarding",
                        "signed",
                        "declined",
                        "closed",
                      ].map((a) => (
                        <option key={a}>{friendly(a)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {!n.candidates.length ? (
                <State text="No candidates in this need." />
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
      <ConfirmationModal
        open={Boolean(pending)}
        title={`${friendly(pending?.action ?? "Update")} recruitment record?`}
        description={`${pending?.name ?? "This record"} will be updated and the reason audited.`}
        confirmLabel={friendly(pending?.action ?? "Update")}
        tone={
          ["cancelled", "declined", "closed"].includes(pending?.action ?? "")
            ? "danger"
            : "warning"
        }
        disabled={reason.trim().length < 5}
        error={actionError}
        loading={acting}
        onCancel={() => setPending(null)}
        onConfirm={() => void act()}
      >
        <Field label="Administrative reason">
          <textarea
            className="min-h-28 rounded-xl border p-3"
            onChange={(e) => setReason(e.target.value)}
            value={reason}
          />
        </Field>
      </ConfirmationModal>
    </div>
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
    <header className="flex flex-col justify-between gap-4 rounded-2xl bg-[#07132F] p-6 text-white lg:flex-row lg:items-end">
      <div>
        <p className="m-0 text-sm font-bold uppercase text-[#F0C400]">
          Football operations
        </p>
        <h1 className="my-2 text-3xl font-extrabold">Recruitment</h1>
        <p className="m-0 max-w-3xl text-base text-slate-300">
          Oversee club and coach recruitment needs, candidate pipelines,
          assignments, shortlists, trial handoffs, onboarding and signed
          outcomes.
        </p>
        <p className="mt-3 text-sm text-slate-400">Updated {date(updated)}</p>
      </div>
      <button className="button button--primary" onClick={() => void refresh()}>
        Refresh
      </button>
    </header>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
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
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mt-0">{title}</h3>
      {children}
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
function Badge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
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
function State({ text }: { text: string }) {
  return (
    <div className="grid min-h-40 place-items-center text-slate-500">
      {text}
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
