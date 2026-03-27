"use client";

import { cn } from "@/utils/cn";

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function AdminsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5 5.5 6v5.4c0 4.1 2.8 7.9 6.5 9.1 3.7-1.2 6.5-5 6.5-9.1V6L12 3.5Z" />
      <path d="M9.8 11.9 11.3 13.4 14.8 9.9" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 18.5v-.9a3.1 3.1 0 0 0-3.1-3.1H8.6a3.1 3.1 0 0 0-3.1 3.1v.9" />
      <circle cx="10.5" cy="8.5" r="3" />
      <path d="M18.5 18.5v-.7a2.8 2.8 0 0 0-2.2-2.7" />
      <path d="M15.8 5.8a2.8 2.8 0 0 1 0 5.4" />
    </svg>
  );
}

function ToursIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 20.5s5-4.4 5-9a5 5 0 1 0-10 0c0 4.6 5 9 5 9Z" />
      <circle cx="14.5" cy="11.5" r="1.5" />
      <path d="M4 6.5h5" />
      <path d="M3.5 11.5h4" />
      <path d="M4.5 16.5h5.5" />
    </svg>
  );
}

function BookingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10.5h16" />
      <path d="m9.5 15 1.8 1.8 3.4-3.6" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="m5.5 7 6.5 5 6.5-5" />
    </svg>
  );
}

const NAV_ICON_MAP = {
  dashboard: DashboardIcon,
  admins: AdminsIcon,
  users: UsersIcon,
  tours: ToursIcon,
  bookings: BookingsIcon,
  contacts: ContactsIcon,
};

function getInitials(fullName) {
  return String(fullName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function AdminSidebar({
  items,
  activeKey,
  onSelect,
  currentUser,
  isOpen = true,
  onClose,
}) {
  const currentName = currentUser?.fullName || "Admin BETOURIST";

  function handleSelect(itemKey) {
    onSelect(itemKey);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose?.();
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/45 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onClose?.()}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-900 text-slate-100 shadow-[0_28px_60px_rgba(15,23,42,0.3)] transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-6">
            <p className="text-xs font-semibold tracking-[0.3em] text-sky-300">
              ADMIN
            </p>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 transition hover:border-slate-500 hover:text-white lg:hidden"
              aria-label="Đóng sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 6 12 12" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="border-b border-slate-800 px-6 py-5">
            <div className="flex items-center gap-4  p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/15 text-lg font-semibold text-sky-200">
                {getInitials(currentName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold  tracking-[0.25em] text-slate-400">
                  Xin chào
                </p>
                <p className="mt-1 truncate text-base font-semibold text-white">Admin</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Tổng quan
            </p>

            <nav className="mt-4 space-y-2">
              {items.map((item) => {
                const Icon = NAV_ICON_MAP[item.key] || DashboardIcon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelect(item.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                      activeKey === item.key
                        ? "bg-sky-500/15 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
                        activeKey === item.key
                          ? "border-sky-400/30 bg-sky-400/15 text-sky-200"
                          : "border-slate-700 bg-slate-800/70 text-slate-400"
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
