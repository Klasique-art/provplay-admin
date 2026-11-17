"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import type { AdminUserDetail } from "@/types/admin-user.types";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => <div className="grid aspect-video place-items-center bg-[#050A1A] text-sm text-slate-300">Loading secure player…</div>,
});

export function HighlightVideoCard({ highlight, playerName }: { highlight: AdminUserDetail["highlights"][number]; playerName: string }) {
  const [opened, setOpened] = useState(false);
  const media = object(highlight.media);
  const playbackId = text(media.playback_id) ?? text(media.playbackId);
  const source = text(media.hls_url) ?? text(media.hlsUrl);
  const poster = highlight.thumbnail_url ?? text(media.thumbnail_url) ?? text(media.thumbnailUrl) ?? (playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1` : null);
  const playable = Boolean(playbackId || source);
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="relative aspect-video overflow-hidden bg-[#050A1A]">
      {opened && playable ? <MuxPlayer accentColor="#E6B800" autoPlay className="h-full w-full" metadata={{ video_id: highlight.highlight_id, video_title: highlight.caption ?? `Highlight by ${playerName}`, viewer_user_id: "provplay-admin" }} playbackId={playbackId ?? undefined} poster={poster ?? undefined} preload="metadata" src={playbackId ? undefined : source ?? undefined} streamType="on-demand" /> : <>{poster ? <Image alt={highlight.caption ? `${playerName}: ${highlight.caption}` : `${playerName} highlight`} className="object-cover" fill loading="lazy" sizes="(max-width:640px) 100vw,(max-width:1280px) 50vw,33vw" src={poster} /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#243B6B,#050A1A)] text-sm text-slate-300">Preview unavailable</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />{playable ? <button aria-label={`Play ${highlight.caption ?? "highlight"}`} className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full border border-white/60 bg-black/55 text-2xl text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-[#E6B800] hover:text-[#050A1A]" onClick={() => setOpened(true)} type="button"><span className="ml-1" aria-hidden="true">▶</span></button> : <span className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-bold text-white">Video is still processing</span>}</>}
      {opened ? <button className="absolute right-3 top-3 z-10 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-bold text-white backdrop-blur" onClick={() => setOpened(false)} type="button">Close player</button> : null}
    </div>
    <div className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Status status={highlight.status} /><span className="text-sm text-slate-500">{friendly(highlight.visibility)}</span></div><h3 className="mb-2 mt-3 text-base leading-6 text-[#0F1F42]">{highlight.caption || "Untitled player highlight"}</h3><p className="m-0 text-sm text-slate-500">{date(highlight.created_at)} · {duration(media.duration_seconds)}</p>{highlight.tags.length ? <div className="mt-3 flex flex-wrap gap-1.5">{highlight.tags.map((tag) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600" key={tag}>#{tag}</span>)}</div> : null}<Stats value={highlight.stats} /><AiRating value={highlight.ai_rating} /></div>
  </article>;
}

function AiRating({ value }: { value: unknown }) {
  const rating = object(value), status = text(rating.status) ?? (Object.keys(rating).length ? "available" : "not_rated"), overall = number(rating.overall), metrics = object(rating.metrics);
  return <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50" open={status === "ready"}><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"><span><span className="block text-xs font-extrabold uppercase tracking-wide text-[#B58A00]">AI performance rating</span><strong className="mt-1 block text-sm">{friendly(status)}</strong></span>{overall !== null ? <span className="grid size-12 place-items-center rounded-full bg-[#0F1F42] text-lg font-extrabold text-white">{overall}</span> : null}</summary><div className="border-t border-slate-200 p-4">{Object.keys(metrics).length ? <div className="grid gap-3 sm:grid-cols-2">{Object.entries(metrics).map(([key, raw]) => { const score = number(raw); return <div key={key}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-bold text-slate-700">{friendly(key)}</span><strong>{score ?? display(raw)}</strong></div>{score !== null ? <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#E6B800]" style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} /></div> : null}</div>; })}</div> : <p className="m-0 text-sm text-slate-500">{status === "processing" ? "AI analysis is still processing." : status === "failed" ? "AI analysis failed and may need to be retried." : "No AI rating has been generated for this highlight."}</p>}<div className="mt-4 grid gap-2 border-t border-slate-200 pt-3 text-sm text-slate-500">{Object.entries(rating).filter(([key]) => !["metrics", "overall"].includes(key)).map(([key, raw]) => <div className="flex justify-between gap-4" key={key}><span>{friendly(key)}</span><strong className="text-right text-slate-700">{display(raw)}</strong></div>)}</div></div></details>;
}
function Stats({ value }: { value: unknown }) { const entries = Object.entries(object(value)); if (!entries.length) return null; return <div className="mt-4 grid grid-cols-2 gap-2 border-y border-slate-100 py-3 sm:grid-cols-4">{entries.map(([key, raw]) => <div key={key}><strong className="block text-base text-[#0F1F42]">{typeof raw === "number" ? raw.toLocaleString() : display(raw)}</strong><span className="text-xs text-slate-500">{friendly(key.replace("Count", ""))}</span></div>)}</div>; }
function Status({ status }: { status: string }) { const active = status === "published"; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{friendly(status)}</span>; }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function text(value: unknown) { return typeof value === "string" && value ? value : null; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function display(value: unknown): string { if (value === null || value === undefined) return "—"; if (Array.isArray(value)) return value.map(display).join(", "); if (typeof value === "object") return Object.entries(object(value)).map(([key, raw]) => `${friendly(key)}: ${display(raw)}`).join(" · "); return String(value); }
function friendly(value: string) { return value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function date(value: string) { return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(value)); }
function duration(value: unknown) { const seconds = number(value); if (seconds === null) return "Duration unavailable"; const minutes = Math.floor(seconds / 60), remainder = Math.round(seconds % 60); return `${minutes}:${String(remainder).padStart(2, "0")}`; }
