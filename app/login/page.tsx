import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#050A1A] px-5 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(230,184,0,0.14),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(34,77,155,0.2),transparent_35%)]" />
      <section className="relative w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#091229]/90 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#E6B800] text-xl font-black text-[#050A1A] shadow-lg shadow-[#E6B800]/15">P</span>
          <div><h1 className="text-xl font-extrabold">ProvPlay</h1><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E6B800]">Control</p></div>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6B800]">Administration</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to manage ProvPlay accounts, moderation, subscriptions, content, and platform operations.</p>
        </div>
        <Suspense fallback={<div className="mt-8 h-60 animate-pulse rounded-2xl bg-white/5" />}>
          <AdminLoginForm />
        </Suspense>
        <p className="mt-7 text-center text-xs text-slate-500">Restricted to authorised ProvPlay administrators.</p>
      </section>
    </main>
  );
}
