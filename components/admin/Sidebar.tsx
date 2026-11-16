"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "@/config/admin-pages";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen flex-col overflow-hidden border-r border-[#162A5C] bg-[#050A1A] text-white md:flex">
      <Link className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5" href="/" aria-label="ProvPlay Control home">
        <span className="grid size-9 place-items-center rounded-[10px] bg-[#E6B800] text-lg font-extrabold text-[#050A1A] shadow-[0_0_0_3px_rgba(230,184,0,.12)]">P</span>
        <span className="grid gap-1 leading-none"><strong className="text-base tracking-tight">ProvPlay</strong><small className="text-[9px] font-bold tracking-[.18em] text-[#A3B8D9]">CONTROL</small></span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]" aria-label="Administration">
        {navGroups.map((group) => (
          <section className="mb-5" key={group.label}>
            <h2 className="mx-2.5 mb-2 text-[10px] font-bold uppercase tracking-[.11em] text-[#8197BA]">{group.label}</h2>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link className={`my-0.5 flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] font-medium ${active ? "bg-[#162A5C] text-white shadow-[inset_3px_0_#E6B800]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-md text-[8px] font-extrabold ${active ? "bg-[#E6B800]/15 text-[#F5D033]" : "bg-white/5 text-[#A3B8D9]"}`}>{item.short}</span>{item.label}
                </Link>
              );
            })}
          </section>
        ))}
      </nav>
      <div className="flex h-16 shrink-0 items-center gap-3 border-t border-white/10 px-5">
        <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(66,211,146,.12)]" />
        <div className="grid gap-0.5"><strong className="text-[11px]">Production</strong><small className="text-[9px] text-[#8197BA]">All systems operational</small></div>
      </div>
    </aside>
  );
}
