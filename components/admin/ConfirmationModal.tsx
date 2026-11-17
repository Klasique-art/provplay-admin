"use client";

import { useEffect, type ReactNode } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "neutral";
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationModal({ open, title, description, confirmLabel, cancelLabel = "Cancel", tone = "warning", loading = false, disabled = false, error, children, onCancel, onConfirm }: ConfirmationModalProps) {
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onCancel(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", escape); };
  }, [loading, onCancel, open]);
  if (!open) return null;
  const icon = tone === "danger" ? "!" : tone === "warning" ? "?" : "i";
  const iconStyle = tone === "danger" ? "bg-red-100 text-red-700" : tone === "warning" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700";
  const confirmStyle = tone === "danger" ? "border-red-700 bg-red-700 text-white hover:bg-red-800" : "button--primary";
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#050A1A]/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel(); }}>
    <section aria-describedby="confirmation-description" aria-labelledby="confirmation-title" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="alertdialog">
      <div className="p-6 sm:p-7"><div className={`mb-4 grid size-12 place-items-center rounded-full text-xl font-extrabold ${iconStyle}`} aria-hidden="true">{icon}</div><h2 className="m-0 text-2xl text-[#0F1F42]" id="confirmation-title">{title}</h2><p className="mb-0 mt-3 text-base leading-7 text-slate-600" id="confirmation-description">{description}</p>{children ? <div className="mt-5">{children}</div> : null}{error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div> : null}</div>
      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end"><button className="button button--secondary" disabled={loading} onClick={onCancel} type="button">{cancelLabel}</button><button className={`button ${confirmStyle}`} disabled={loading || disabled} onClick={onConfirm} type="button">{loading ? "Please wait…" : confirmLabel}</button></div>
    </section>
  </div>;
}
