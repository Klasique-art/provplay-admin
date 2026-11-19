"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
type RecordItem = Record<string, unknown>;
type Data = {
  generated_at: string;
  summary: Record<string, number>;
  contracts: RecordItem[];
  offers: RecordItem[];
  representations: RecordItem[];
};
type Tab = "contracts" | "offers" | "representations";
export function ContractsOperationsPage() {
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [tab, setTab] = useState<Tab>("contracts"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [open, setOpen] = useState<string | null>(null),
    [pending, setPending] = useState<{
      type: "contract" | "offer" | "representation";
      id: string;
      action: string;
    } | null>(null),
    [reason, setReason] = useState(""),
    [acting, setActing] = useState(false),
    [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/operations/contracts", {
          cache: "no-store",
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Contracts could not be loaded.");
      setData(p.data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Contracts could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  const rows = useMemo(() => {
    const source = data?.[tab] ?? [],
      q = search.toLowerCase();
    return source.filter(
      (x) =>
        (status === "all" || String(x.status) === status) &&
        (!q || JSON.stringify(x).toLowerCase().includes(q)),
    );
  }, [data, search, status, tab]);
  async function act() {
    if (!pending || reason.trim().length < 5) return;
    setActing(true);
    try {
      const r = await fetch("/api/admin/operations/contracts/actions", {
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
        throw new Error(p.error?.message ?? "Contract action failed.");
      setPending(null);
      await load();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Contract action failed.",
      );
    } finally {
      setActing(false);
    }
  }
  if (loading && !data) return <State text="Loading contract operations…" />;
  if (error && !data) return <State text={error} />;
  if (!data) return null;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl bg-[#07132F] p-6 text-white lg:flex-row lg:items-end">
        <div>
          <p className="m-0 text-sm font-bold uppercase text-[#F0C400]">
            Agreements and authority
          </p>
          <h1 className="my-2 text-3xl font-extrabold">Contracts</h1>
          <p className="m-0 max-w-3xl text-base text-slate-300">
            Oversee player-club contracts, agent agreements, offers,
            representation authority, decisions, dates, renewals, suspensions
            and termination history.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Updated {date(data.generated_at)}
          </p>
        </div>
        <button className="button button--primary" onClick={() => void load()}>
          Refresh
        </button>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
        {Object.entries(data.summary).map(([k, v]) => (
          <Metric key={k} label={friendly(k)} value={v} />
        ))}
      </section>
      <section className="rounded-2xl border bg-white">
        <div className="flex overflow-x-auto border-b">
          {(["contracts", "offers", "representations"] as Tab[]).map((x) => (
            <button
              className={`border-b-2 px-5 py-4 text-base font-bold ${tab === x ? "border-[#E6B800]" : "border-transparent text-slate-500"}`}
              key={x}
              onClick={() => {
                setTab(x);
                setStatus("all");
              }}
            >
              {friendly(x)} ({data[x].length})
            </button>
          ))}
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
          <Field label="Search">
            <input
              className="control"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Party, title, ID, reference…"
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
              {statuses[tab].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      <section className="space-y-4">
        {rows.map((row) => {
          const id = identity(tab, row),
            title = String(
              row.title ??
                row.agreementType ??
                row.contract_id ??
                row.offerId ??
                row.representationId,
            ),
            isOpen = open === id;
          return (
            <article
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              key={id}
            >
              <div className="flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex gap-2">
                    <Badge value={String(row.kind ?? tab.slice(0, -1))} />
                    <Badge value={String(row.status ?? "unknown")} />
                  </div>
                  <h2 className="mb-1 mt-2 text-xl">{title}</h2>
                  <p className="m-0 text-sm text-slate-500">
                    {id} · {party(row)} · updated{" "}
                    {date(
                      String(
                        row.updated_at ??
                          row.updatedAt ??
                          row.created_at ??
                          row.createdAt,
                      ),
                    )}
                  </p>
                </div>
                <button
                  className="button button--secondary"
                  onClick={() => setOpen(isOpen ? null : id)}
                >
                  {isOpen ? "Close" : "Inspect agreement"}
                </button>
              </div>
              {isOpen ? (
                <div className="grid gap-5 border-t bg-slate-50 p-5 lg:grid-cols-[1fr_360px]">
                  <div>
                    <h3>Complete record</h3>
                    <Json value={row} />
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <h3 className="mt-0">Administrative status control</h3>
                    <div className="flex flex-wrap gap-2">
                      {statuses[tab].map((action) => (
                        <button
                          className="button button--secondary"
                          key={action}
                          onClick={() => {
                            setPending({
                              type: tab.slice(0, -1) as
                                "contract" | "offer" | "representation",
                              id,
                              action,
                            });
                            setReason("");
                            setActionError(null);
                          }}
                        >
                          {friendly(action)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                      Every override requires a reason and is stored separately
                      from the agreement’s own history.
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
      {!rows.length ? <State text={`No ${tab} match these filters.`} /> : null}
      <ConfirmationModal
        open={Boolean(pending)}
        title={`${friendly(pending?.action ?? "Update")} ${pending?.type ?? "record"}?`}
        description="This changes the canonical agreement state. The administrative reason will be retained in audit history."
        confirmLabel={friendly(pending?.action ?? "Update")}
        tone={
          ["terminated", "ended", "revoked", "rejected", "withdrawn"].includes(
            pending?.action ?? "",
          )
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
const statuses: Record<Tab, string[]> = {
  contracts: [
    "draft",
    "pending",
    "awaiting_player",
    "active",
    "suspended",
    "expired",
    "terminated",
    "ended",
  ],
  offers: [
    "draft",
    "sent",
    "countered",
    "awaiting_client",
    "accepted",
    "rejected",
    "withdrawn",
    "expired",
  ],
  representations: ["active", "suspended", "ending", "ended", "revoked"],
};
function identity(tab: Tab, x: RecordItem) {
  return String(
    tab === "contracts"
      ? x.contract_id
      : tab === "offers"
        ? x.offerId
        : x.representationId,
  );
}
function party(x: RecordItem) {
  const candidates = [
    x.player,
    x.club,
    x.organization,
    x.owner_agent,
    x.client,
  ].filter(Boolean) as RecordItem[];
  return (
    candidates
      .map((p) => p.full_name)
      .filter(Boolean)
      .join(" ↔ ") || "Parties unavailable"
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
function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-xs">
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
    <div className="grid min-h-48 place-items-center text-slate-500">
      {text}
    </div>
  );
}
function friendly(x: string) {
  return x.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function date(x: string) {
  const d = new Date(x);
  return Number.isNaN(d.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat("en-GH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
}
function csrf() {
  return (
    document.cookie.match(/(?:^|; )provplay_admin_csrf=([^;]+)/)?.[1] ?? ""
  );
}
