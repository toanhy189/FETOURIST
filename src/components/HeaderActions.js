"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/providers/AppProvider";

function getInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  return words
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function BellIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function LogOutIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function HeaderActions() {
  const router = useRouter();
  const {
    currentUser,
    isAdmin,
    isAuthenticated,
    isBootstrapping,
    logout,
    notificationCount,
  } = useAppContext();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (isBootstrapping) {
    return (
      <div className="text-sm font-medium text-slate-400">
        Đang khởi tạo phiên...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dang-nhap"
          className="rounded-full border border-slate-200/80 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
        >
          Đăng nhập
        </Link>
        <Link
          href="/dang-ky"
          className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={isAdmin ? "/admin" : "/tai-khoan"}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white shadow-sm transition hover:border-sky-300 hover:shadow"
        title={currentUser?.fullName || "Tài khoản"}
      >
        {currentUser?.avatarUrl ? (
          <img
            src={currentUser.avatarUrl}
            alt={currentUser?.fullName || "Avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-sky-700">
            {getInitials(currentUser?.fullName)}
          </span>
        )}
      </Link>

      <Link
        href="/tai-khoan"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        title="Thông báo"
      >
        <BellIcon />
        {notificationCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        ) : null}
      </Link>

      {isAdmin ? (
        <Link
          href="/admin"
          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
        >
          Quản trị
        </Link>
      ) : null}

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700"
        title="Đăng xuất"
      >
        <LogOutIcon />
      </button>
    </div>
  );
}