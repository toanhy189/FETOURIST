"use client";

import { useEffect } from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function BookingModal({
  open,
  title,
  onClose,
  children,
  size = "lg",
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "xl"
      ? "max-w-5xl"
      : size === "md"
      ? "max-w-2xl"
      : "max-w-3xl";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl",
          sizeClass
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50"
          >
            ×
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}