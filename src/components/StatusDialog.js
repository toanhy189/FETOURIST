"use client";

import { cn } from "@/utils/cn";

function CheckIcon({ className = "h-12 w-12" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m7.8 12.2 2.7 2.7 5.8-6" />
    </svg>
  );
}

export default function StatusDialog({
  open,
  title,
  message,
  highlight,
  actionLabel = "OK",
  tone = "success",
  onClose,
}) {
  if (!open) {
    return null;
  }

  const toneClassName = {
    success: {
      icon: "border-emerald-100 bg-emerald-50 text-emerald-500",
      button: "bg-orange-500 text-white hover:bg-orange-400",
      highlight: "text-orange-500",
    },
    info: {
      icon: "border-sky-100 bg-sky-50 text-sky-500",
      button: "bg-sky-600 text-white hover:bg-sky-500",
      highlight: "text-sky-600",
    },
  }[tone] || {};

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-none bg-white px-6 py-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
      >
        <div className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-full border", toneClassName.icon)}>
          <CheckIcon />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-700">{title}</h2>
        <p className="mx-auto mt-4 max-w-[280px] text-sm leading-6 text-slate-500">
          {highlight ? (
            <>
              <span>{message} </span>
              <span className={cn("font-bold", toneClassName.highlight)}>{highlight}</span>
            </>
          ) : (
            message
          )}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={cn("mt-6 h-10 min-w-28 rounded px-6 text-sm font-bold transition", toneClassName.button)}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
