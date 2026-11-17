"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ConfirmationModal } from "./ConfirmationModal";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNavigationOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = previousOverflow; };
  }, [mobileNavigationOpen]);

  if (pathname === "/login") return children;

  async function logout() {
    setLoggingOut(true); setLogoutError(null);
    const csrf = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("provplay_admin_csrf="))
      ?.split("=")
      .slice(1)
      .join("=");
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST", headers: csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : undefined });
      if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.error?.message ?? "Sign out could not be completed."); }
      setLogoutOpen(false); router.replace("/login"); router.refresh();
    } catch (cause) { setLogoutError(cause instanceof Error ? cause.message : "Sign out could not be completed."); }
    finally { setLoggingOut(false); }
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar />
      {mobileNavigationOpen ? <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Administration navigation" aria-modal="true"><button aria-label="Close navigation" className="absolute inset-0 cursor-default bg-slate-950/65 backdrop-blur-sm" onClick={() => setMobileNavigationOpen(false)} type="button" /><div className="relative h-full w-fit shadow-2xl"><Sidebar mobile onNavigate={() => setMobileNavigationOpen(false)} /></div></div> : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <button aria-expanded={mobileNavigationOpen} aria-label="Open navigation" className="grid size-10 place-items-center gap-1 rounded-lg border border-slate-200 bg-white py-2.5 text-[#0F1F42]" onClick={() => setMobileNavigationOpen(true)} type="button"><span className="h-0.5 w-4 rounded bg-current" /><span className="h-0.5 w-4 rounded bg-current" /><span className="h-0.5 w-4 rounded bg-current" /></button>
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#E6B800] text-sm font-extrabold text-[#050A1A]">P</span>
            <strong className="text-xs">ProvPlay</strong>
          </div>
          <label className="hidden h-10 w-full max-w-[440px] items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 text-slate-500 sm:flex">
            <span aria-hidden="true">⌕</span><span className="sr-only">Search ProvPlay Control</span>
            <input className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none" placeholder="Search accounts, cases, payments…" type="search" />
            <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px]">⌘ K</kbd>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden size-9 rounded-lg border border-slate-200 bg-white text-slate-600 sm:block" aria-label="Open incidents">!</button>
            <button className="size-9 rounded-lg border border-slate-200 bg-white text-slate-600" aria-label="Open notifications">●</button>
            <button onClick={() => { setLogoutOpen(true); setLogoutError(null); }} className="flex items-center gap-2 border-l border-slate-200 bg-transparent pl-3 text-left" title="Sign out">
              <span className="grid size-9 place-items-center rounded-full bg-[#0F1F42] text-xs font-extrabold text-white">KA</span>
              <span className="hidden leading-tight lg:grid"><strong className="text-sm">Klasique Admin</strong><small className="text-xs text-slate-500">Sign out</small></span>
            </button>
          </div>
        </header>
        <main className="p-4 pb-24 md:p-6">{children}</main>
      </div>
      <ConfirmationModal confirmLabel="Sign out" description="You will leave ProvPlay Control and must sign in again before accessing administrative data." error={logoutError} loading={loggingOut} onCancel={() => { if (!loggingOut) setLogoutOpen(false); }} onConfirm={() => void logout()} open={logoutOpen} title="Sign out of ProvPlay Control?" tone="warning" />
    </div>
  );
}
