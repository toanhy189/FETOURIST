"use client";

import { cn } from "@/utils/cn";

function getInitials(fullName) {
  return String(fullName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function AdminSidebar({ items, activeKey, onSelect, currentUser }) {
  const currentName = currentUser?.fullName || "Admin BETOURIST";

  return (
    <aside className="border-b border-slate-800 bg-slate-900 text-slate-100 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">BETOURIST</h1>
          <p className="mt-2 text-sm text-slate-400">
            Dieu hanh nguoi dung, tour, booking va lien he tren cung mot workspace.
          </p>
        </div>

        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-4 rounded-3xl bg-slate-800/80 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/15 text-lg font-semibold text-sky-200">
              {getInitials(currentName)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Xin chao
              </p>
              <p className="mt-1 truncate text-base font-semibold text-white">{currentName}</p>
              <p className="mt-1 text-sm text-slate-400">Tai khoan quan tri dang hoat dong</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Tong quan
          </p>

          <nav className="mt-4 space-y-2">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition",
                  activeKey === item.key
                    ? "bg-sky-500/15 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 rounded-full",
                    activeKey === item.key ? "bg-sky-300" : "bg-slate-600"
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    {item.hint}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
