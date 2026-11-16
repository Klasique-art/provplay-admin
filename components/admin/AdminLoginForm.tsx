"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function loginErrorMessage(
    response: Response,
    payload: {
      message?: string;
      error?: { code?: string; message?: string };
      errors?: Array<{ code?: string; message?: string }>;
    } | null,
  ) {
    const code = payload?.error?.code ?? payload?.errors?.[0]?.code;
    if (response.status === 401 || code === "ADMIN_LOGIN_INVALID")
      return "The username or password is incorrect. Check both fields and try again.";
    if (response.status === 423 || code === "ADMIN_LOGIN_LOCKED")
      return "This administrator account is temporarily locked after too many failed attempts. Wait 15 minutes, then try again.";
    if (response.status === 429)
      return "Too many sign-in attempts. Wait a few minutes before trying again.";
    if (response.status === 503 || code === "ADMIN_API_UNAVAILABLE")
      return "The ProvPlay server cannot be reached right now. Check your connection or try again shortly.";
    if (response.status >= 500)
      return "ProvPlay encountered a server error while signing you in. Please try again shortly.";
    return payload?.error?.message ?? payload?.message ?? payload?.errors?.[0]?.message ?? "Sign-in could not be completed. Please try again.";
  }

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
      const payload = await response.json().catch(() => null) as {
        message?: string;
        error?: { code?: string; message?: string };
        errors?: Array<{ code?: string; message?: string }>;
      } | null;
      if (!response.ok) throw new Error(loginErrorMessage(response, payload));
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
        <span className="relative block">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={12} className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 pr-14 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-[#E6B800] focus:ring-4 focus:ring-[#E6B800]/10" placeholder="Enter your password" />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-white focus-visible:outline-offset-[-3px]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a15 15 0 0 1-2.1 2.5M6.6 6.6C4.4 8 3 10 3 10s3.5 5 9 5c1 0 1.9-.2 2.7-.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2.5" /></svg>
            )}
          </button>
        </span>
      </label>
      {error ? <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-red-100"><strong className="block text-sm">Sign-in failed</strong><p className="mb-0 mt-1 text-xs leading-5 text-red-200">{error}</p></div> : null}
      <button disabled={loading} className="mt-1 h-12 rounded-xl bg-[#E6B800] font-extrabold text-[#050A1A] transition hover:bg-[#f2c300] disabled:cursor-wait disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in to Control"}
      </button>
    </form>
  );
}
