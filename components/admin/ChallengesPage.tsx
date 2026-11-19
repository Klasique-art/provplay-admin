"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminChallenge,
  AdminChallengeData,
  ChallengeSubmission,
} from "@/types/admin-challenge.types";
import type { ApiEnvelope, AdminUserDetail } from "@/types/admin-user.types";
import { AccountAvatar } from "./AccountAvatar";
import { ConfirmationModal } from "./ConfirmationModal";
import { HighlightVideoCard } from "./HighlightVideoCard";
type Pending = {
  action:
    "approve_submission" | "reject_submission" | "add_juror" | "remove_juror";
  challenge: AdminChallenge;
  submission?: ChallengeSubmission;
  userId?: string;
};
export function ChallengesPage() {
  const [data, setData] = useState<AdminChallengeData | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [phase, setPhase] = useState("all"),
    [open, setOpen] = useState<string | null>(null),
    [submissionOpen, setSubmissionOpen] = useState<string | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [reason, setReason] = useState(""),
    [jurorId, setJurorId] = useState(""),
    [acting, setActing] = useState(false),
    [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/content/challenges", {
          cache: "no-store",
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Challenges could not be loaded.");
      setData((p as ApiEnvelope<AdminChallengeData>).data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Challenges could not be loaded.",
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
          (phase === "all" || x.phase === phase) &&
          (!q ||
            [x.title, x.description, x.theme, x.slug].some((v) =>
              v.toLowerCase().includes(q),
            ))
        );
      }) ?? [],
    [data, search, phase],
  );
  function choose(value: Pending) {
    setPending(value);
    setReason("");
    setJurorId(value.userId ?? "");
    setActionError(null);
  }
  async function act() {
    if (!pending || reason.trim().length < 5) return;
    const body = pending.action.includes("submission")
      ? {
          action: pending.action,
          submission_id: pending.submission?.submission_id,
          reason: reason.trim(),
        }
      : {
          action: pending.action,
          challenge_id: pending.challenge.challenge_id,
          user_id: jurorId.trim(),
          reason: reason.trim(),
        };
    setActing(true);
    setActionError(null);
    try {
      const r = await fetch("/api/admin/content/challenges/actions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf(),
          },
          body: JSON.stringify(body),
        }),
        p = await r.json();
      if (!r.ok || !p.success)
        throw new Error(p.error?.message ?? "Challenge action failed.");
      setPending(null);
      await load();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Challenge action failed.",
      );
    } finally {
      setActing(false);
    }
  }
  if (loading && !data) return <State text="Loading talent challenges…" />;
  if (error && !data) return <State text={error} button={load} />;
  if (!data) return null;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl bg-[#07132F] p-5 text-white lg:flex-row lg:items-end lg:p-7">
        <div>
          <p className="m-0 text-sm font-extrabold uppercase tracking-[.14em] text-[#F0C400]">
            Competition operations
          </p>
          <h1 className="mb-2 mt-2 text-3xl font-extrabold sm:text-4xl">
            Talent challenges
          </h1>
          <p className="m-0 max-w-3xl text-base leading-7 text-slate-300">
            Operate challenge phases, eligibility rules, entries, moderation,
            jury coverage, scores, results, winners, and prize handoffs.
          </p>
          <p className="mb-0 mt-3 text-sm text-slate-400">
            Updated {date(data.generated_at)}
          </p>
        </div>
        <button className="button button--primary" onClick={() => void load()}>
          Refresh challenges
        </button>
      </header>
      {error ? <Notice>{error}</Notice> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="All challenges" value={data.summary.total} />
        <Metric label="Live" value={data.summary.live} />
        <Metric label="Upcoming" value={data.summary.upcoming} />
        <Metric
          label="Entries awaiting review"
          value={data.summary.pending_submissions}
          danger
        />
        <Metric
          label="Results published"
          value={data.summary.published_results}
        />
        <Metric
          label="Unclaimed prizes"
          value={data.summary.unclaimed_prizes}
          warn
        />
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px]">
        <Field label="Search challenges">
          <input
            className="control"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, theme, slug…"
            value={search}
          />
        </Field>
        <Field label="Current phase">
          <select
            className="control"
            onChange={(e) => setPhase(e.target.value)}
            value={phase}
          >
            <option value="all">All phases</option>
            {[
              "upcoming",
              "announcement",
              "submission",
              "voting",
              "jury_review",
              "results",
              "completed",
            ].map((x) => (
              <option key={x} value={x}>
                {friendly(x)}
              </option>
            ))}
          </select>
        </Field>
        <p className="m-0 text-sm text-slate-500 md:col-span-2">
          {items.length} challenges match
        </p>
      </section>
      <section className="space-y-5">
        {items.map((item) => (
          <ChallengeCard
            challenge={item}
            expanded={open === item.challenge_id}
            submissionOpen={submissionOpen}
            key={item.challenge_id}
            toggle={() =>
              setOpen(open === item.challenge_id ? null : item.challenge_id)
            }
            toggleSubmission={(id) =>
              setSubmissionOpen(submissionOpen === id ? null : id)
            }
            choose={choose}
          />
        ))}
      </section>
      {!items.length ? (
        <State text="No talent challenges match these filters." />
      ) : null}
      <ConfirmationModal
        open={Boolean(pending)}
        title={pending ? copy[pending.action].title : "Confirm action"}
        description={pending ? copy[pending.action].description : ""}
        confirmLabel={pending ? copy[pending.action].label : "Confirm"}
        tone={
          pending?.action === "reject_submission" ||
          pending?.action === "remove_juror"
            ? "danger"
            : "warning"
        }
        disabled={
          reason.trim().length < 5 ||
          (pending?.action === "add_juror" && !jurorId.trim())
        }
        error={actionError}
        loading={acting}
        onCancel={() => {
          if (!acting) setPending(null);
        }}
        onConfirm={() => void act()}
      >
        {pending?.action === "add_juror" ? (
          <Field label="Juror user ID">
            <input
              className="control"
              onChange={(e) => setJurorId(e.target.value)}
              placeholder="usr_…"
              value={jurorId}
            />
          </Field>
        ) : null}
        <div className="mt-4">
          <Field label="Administrative reason">
            <textarea
              autoFocus
              className="min-h-28 rounded-xl border border-slate-300 p-3 text-base"
              onChange={(e) => setReason(e.target.value)}
              value={reason}
            />
          </Field>
        </div>
      </ConfirmationModal>
    </div>
  );
}
function ChallengeCard({
  challenge,
  expanded,
  submissionOpen,
  toggle,
  toggleSubmission,
  choose,
}: {
  challenge: AdminChallenge;
  expanded: boolean;
  submissionOpen: string | null;
  toggle: () => void;
  toggleSubmission: (id: string) => void;
  choose: (p: Pending) => void;
}) {
  const pending = challenge.submissions.filter(
    (x) => x.status === "pending_review",
  ).length;
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative grid min-h-48 items-end overflow-hidden bg-[#07132F] p-5 text-white lg:grid-cols-[1fr_auto] lg:p-7">
        {challenge.cover_image_url ? (
          <Image
            alt=""
            className="object-cover opacity-35"
            fill
            sizes="100vw"
            src={challenge.cover_image_url}
          />
        ) : null}
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <Badge value={challenge.phase} />
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              {challenge.theme}
            </span>
          </div>
          <h2 className="mb-2 mt-3 text-2xl">{challenge.title}</h2>
          <p className="m-0 max-w-3xl text-base leading-7 text-slate-200">
            {challenge.description}
          </p>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-4 text-center lg:mt-0">
          <HeadStat value={challenge.submissions.length} label="Entries" />
          <HeadStat value={pending} label="Pending" />
          <HeadStat value={challenge.view_count} label="Views" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 p-5">
        <button className="button button--secondary" onClick={toggle}>
          {expanded ? "Close operations" : "Open operations"}
        </button>
        {pending ? (
          <span className="text-sm font-bold text-red-700">
            {pending} entries need moderation
          </span>
        ) : null}
        <span className="ml-auto text-sm text-slate-500">
          Results{" "}
          {challenge.results_published_at
            ? `published ${date(challenge.results_published_at)}`
            : "not published"}
        </span>
      </div>
      {expanded ? (
        <div className="space-y-6 border-t border-slate-200 bg-slate-50 p-5 lg:p-7">
          <section>
            <h3 className="mt-0 text-lg">Phase timeline</h3>
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(challenge.phases).map(([name, times]) => (
                <div
                  className={`rounded-xl border p-3 ${challenge.phase === snake(name) ? "border-[#D4A000] bg-amber-50" : "border-slate-200 bg-white"}`}
                  key={name}
                >
                  <strong className="text-sm">{friendly(name)}</strong>
                  <span className="mt-2 block text-sm text-slate-500">
                    {date(times.startsAt)}
                  </span>
                  <span className="block text-sm text-slate-500">
                    to {date(times.endsAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <Panel title="Rules and prizes">
              <ul className="space-y-2 pl-5 text-base">
                {challenge.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <pre className="overflow-x-auto rounded-xl bg-slate-100 p-3 text-sm">
                {JSON.stringify(challenge.prizes, null, 2)}
              </pre>
            </Panel>
            <Panel title="Jury panel">
              <div className="space-y-3">
                {challenge.jury_panel.map((person) => (
                  <div className="flex items-center gap-3" key={person.user_id}>
              <AccountAvatar className="size-11 text-sm" name={person.full_name} sizes="44px" src={person.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <Link
                        className="font-bold hover:underline"
                        href={`/users/${person.user_id}`}
                      >
                        {person.full_name}
                      </Link>
                      <span className="block text-sm text-slate-500">
                        {friendly(person.account_type)} ·{" "}
                        {person.verification_status ??
                          "Verification not reported"}
                      </span>
                    </div>
                    <button
                      className="button button--secondary"
                      onClick={() =>
                        choose({
                          action: "remove_juror",
                          challenge,
                          userId: person.user_id,
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!challenge.jury_panel.length ? (
                  <p className="text-slate-500">No jurors assigned.</p>
                ) : null}
                <button
                  className="button button--primary"
                  onClick={() => choose({ action: "add_juror", challenge })}
                >
                  Add juror by user ID
                </button>
              </div>
            </Panel>
          </section>
          <section>
            <h3 className="text-lg">Entries and scoring</h3>
            <div className="space-y-3">
              {challenge.submissions.map((entry) => (
                <Submission
                  challenge={challenge}
                  entry={entry}
                  expanded={submissionOpen === entry.submission_id}
                  key={entry.submission_id}
                  toggle={() => toggleSubmission(entry.submission_id)}
                  choose={choose}
                />
              ))}
            </div>
            {!challenge.submissions.length ? (
              <State text="No entries have been submitted." />
            ) : null}
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <Panel title="Winners and reward claims">
              {challenge.winners.length ? (
                challenge.winners.map((winner, i) => (
                  <pre
                    className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm"
                    key={i}
                  >
                    {JSON.stringify(winner, null, 2)}
                  </pre>
                ))
              ) : (
                <p className="text-slate-500">
                  No winners have been published.
                </p>
              )}
            </Panel>
            <Panel title="Prize fulfilment handoffs">
              {challenge.prize_leads.length ? (
                challenge.prize_leads.map((lead, i) => (
                  <div
                    className="mb-2 rounded-xl border border-slate-200 p-3 text-sm"
                    key={i}
                  >
                    {Object.entries(lead)
                      .filter(([, v]) => v !== null)
                      .map(([k, v]) => (
                        <div className="flex justify-between gap-3" key={k}>
                          <span>{friendly(k)}</span>
                          <strong>
                            {typeof v === "object"
                              ? JSON.stringify(v)
                              : String(v)}
                          </strong>
                        </div>
                      ))}
                  </div>
                ))
              ) : (
                <p className="text-slate-500">
                  No scout invitation or sponsorship handoffs exist.
                </p>
              )}
            </Panel>
          </section>
        </div>
      ) : null}
    </article>
  );
}
function Submission({
  challenge,
  entry,
  expanded,
  toggle,
  choose,
}: {
  challenge: AdminChallenge;
  entry: ChallengeSubmission;
  expanded: boolean;
  toggle: () => void;
  choose: (p: Pending) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <AccountAvatar className="size-11 text-sm" name={entry.player?.full_name ?? "Unknown player"} sizes="44px" src={entry.player?.avatar_url ?? null} />
        <div className="min-w-0 flex-1">
          <strong>{entry.title}</strong>
          <Link
            className="block text-sm text-slate-500 hover:underline"
            href={`/users/${entry.player?.user_id ?? ""}`}
          >
            {entry.player?.full_name ?? "Unknown player"}
          </Link>
        </div>
        <Badge value={entry.status} />
        <Score value={entry.community_score} label="Community" />
        <Score value={entry.jury_score ?? 0} label="Jury" />
        <Score value={entry.total_score} label="Total" />
        <button className="button button--secondary" onClick={toggle}>
          {expanded ? "Close" : "Review"}
        </button>
      </div>
      {expanded ? (
        <div className="grid gap-5 border-t border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
          <HighlightVideoCard
            highlight={asHighlight(entry)}
            playerName={entry.player?.full_name ?? "Player"}
          />
          <div>
            <p className="text-base leading-7">
              {entry.description || "No entry description."}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Score value={entry.vote_count} label="Votes" />
              <Score value={entry.jury_score_count} label="Jury scores" />
              <Score value={entry.rank ?? "—"} label="Rank" />
            </div>
            <h4>Jury scorecards</h4>
            {entry.jury_scores.map((s, i) => (
              <div
                className="mb-2 rounded-xl border border-slate-200 bg-white p-3 text-sm"
                key={i}
              >
                <strong>
                  {s.juror?.full_name ?? "Unknown juror"} · {s.weighted_score}
                </strong>
                <p className="mb-0 mt-1 text-slate-600">
                  {s.comments || "No comments"}{" "}
                  {s.recommendation ? `· ${s.recommendation}` : ""}
                </p>
              </div>
            ))}
            {entry.status !== "approved" ? (
              <button
                className="button button--primary mr-2"
                onClick={() =>
                  choose({
                    action: "approve_submission",
                    challenge,
                    submission: entry,
                  })
                }
              >
                Approve entry
              </button>
            ) : null}
            {entry.status !== "rejected" ? (
              <button
                className="button button--secondary"
                onClick={() =>
                  choose({
                    action: "reject_submission",
                    challenge,
                    submission: entry,
                  })
                }
              >
                Reject entry
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
function asHighlight(x: ChallengeSubmission) {
  return {
    highlight_id: x.highlight_id,
    caption: x.title,
    tags: [],
    visibility: "challenge entry",
    status: "published",
    created_at: x.created_at,
    media: x.media ?? {},
    thumbnail_url: x.thumbnail_url,
    stats: { votes: x.vote_count },
    ai_rating: null,
  } as unknown as AdminUserDetail["highlights"][number];
}
const copy = {
  approve_submission: {
    title: "Approve this challenge entry?",
    description:
      "The entry becomes eligible for voting, jury scoring, ranking, and results.",
    label: "Approve entry",
  },
  reject_submission: {
    title: "Reject this challenge entry?",
    description:
      "The entry is removed from challenge competition and result calculations.",
    label: "Reject entry",
  },
  add_juror: {
    title: "Assign a challenge juror?",
    description:
      "The active scout, coach, or agent receives jury authority for this challenge.",
    label: "Assign juror",
  },
  remove_juror: {
    title: "Remove this challenge juror?",
    description:
      "The account loses future jury authority. Existing score records remain visible for audit.",
    label: "Remove juror",
  },
};
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
function Metric({
  label,
  value,
  danger = false,
  warn = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${danger && value ? "border-red-200" : warn && value ? "border-amber-300" : "border-slate-200"}`}
    >
      <strong className="block text-2xl text-[#0F1F42]">
        {value.toLocaleString()}
      </strong>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
function HeadStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <strong className="block text-2xl">{value.toLocaleString()}</strong>
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  );
}
function Score({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <strong className="block text-base">{value}</strong>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold ${["approved", "results", "completed"].includes(value) ? "bg-emerald-100 text-emerald-800" : ["rejected", "pending_review"].includes(value) ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}
    >
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
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}
function State({ text, button }: { text: string; button?: () => void }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-slate-600">
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
  return x
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function snake(x: string) {
  return x.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
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
