"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/providers/AppProvider";
import { cn } from "@/utils/cn";

export default function HeaderActions() {
  const router = useRouter();
  const { currentUser, isAdmin, isAuthenticated, isBootstrapping, logout, notificationCount } =
    useAppContext();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (isBootstrapping) {
    return (
      <div className="text-sm font-medium text-slate-400">
        Dang khoi tao phien...
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
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/tai-khoan"
        className={cn(
          "rounded-full border border-slate-200/80 px-3 py-2 text-sm font-semibold text-slate-600 transition",
          "hover:border-sky-300 hover:text-sky-800"
        )}
      >
        {currentUser?.fullName || "Tai khoan"}
      </Link>
      <Link
        href="/tai-khoan"
        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
      >
        Thong bao {notificationCount > 0 ? `(${notificationCount})` : ""}
      </Link>
      {isAdmin ? (
        <Link
          href="/quan-tri"
          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
        >
          Quan tri
        </Link>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-slate-200/80 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-700"
      >
        Dang xuat
      </button>
    </div>
  );
}
