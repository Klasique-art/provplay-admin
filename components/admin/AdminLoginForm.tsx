"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) throw new Error(payload?.error?.message ?? "Unable to sign in.");
      const destination = searchParams.get("next");
      router.replace(destination?.startsWith("/") && !destination.startsWith("//") ? destination : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-semibold text-slate-200">
        Username
        <input name="username" autoComplete="username" required minLength={3} autoFocus className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-[#E6B800] focus:ring-4 focus:ring-[#E6B800]/10" placeholder="Enter your username" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-200">
        Password
        <input name="password" type="password" autoComplete="current-password" required minLength={12} className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-[#E6B800] focus:ring-4 focus:ring-[#E6B800]/10" placeholder="Enter your password" />
      </label>
      {error ? <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      <button disabled={loading} className="mt-1 h-12 rounded-xl bg-[#E6B800] font-extrabold text-[#050A1A] transition hover:bg-[#f2c300] disabled:cursor-wait disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in to Control"}
      </button>
    </form>
  );
}
