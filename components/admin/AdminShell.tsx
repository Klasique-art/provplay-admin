"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return children;

  async function logout() {
    const csrf = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("provplay_admin_csrf="))
      ?.split("=")
      .slice(1)
      .join("=");
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      headers: csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : undefined,
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#E6B800] text-sm font-extrabold text-[#050A1A]">P</span>
            <strong className="text-xs">ProvPlay</strong>
          </div>
          <label className="hidden h-10 w-full max-w-[440px] items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 text-slate-500 sm:flex">
            <span aria-hidden="true">⌕</span><span className="sr-only">Search ProvPlay Control</span>
            <input className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none" placeholder="Search accounts, cases, payments…" type="search" />
            <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px]">⌘ K</kbd>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden size-9 rounded-lg border border-slate-200 bg-white text-slate-600 sm:block" aria-label="Open incidents">!</button>
            <button className="size-9 rounded-lg border border-slate-200 bg-white text-slate-600" aria-label="Open notifications">●</button>
            <button onClick={logout} className="flex items-center gap-2 border-l border-slate-200 bg-transparent pl-3 text-left" title="Sign out">
              <span className="grid size-9 place-items-center rounded-full bg-[#0F1F42] text-[10px] font-extrabold text-white">KA</span>
              <span className="hidden leading-tight lg:grid"><strong className="text-[11px]">Klasique Admin</strong><small className="text-[9px] text-slate-500">Sign out</small></span>
            </button>
          </div>
        </header>
        <main className="p-4 pb-24 md:p-6">{children}</main>
      </div>
    </div>
  );
}
