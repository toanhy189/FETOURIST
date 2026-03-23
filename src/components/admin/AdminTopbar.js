"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/apiService/notifications";
import { useAppContext } from "@/components/providers/AppProvider";
import { formatDateTimeVi } from "@/utils/format";

function getInitials(fullName) {
  return String(fullName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 3a4 4 0 0 0-4 4v1.1c0 .7-.2 1.4-.6 2L6 12.6c-.5.8 0 1.9 1 1.9h10c1 0 1.5-1.1 1-1.9l-1.4-2.5c-.4-.6-.6-1.3-.6-2V7a4 4 0 0 0-4-4Zm0 18a2.7 2.7 0 0 0 2.5-1.7h-5A2.7 2.7 0 0 0 12 21Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M10 4a1 1 0 0 1 0 2H6v12h4a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5Zm6.3 3.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4l2.3-2.3H9a1 1 0 1 1 0-2h9.6l-2.3-2.3a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  loading,
}) {
  return (
    <article
      className={`border-b border-slate-200 px-5 py-4 transition ${
        notification.isRead ? "bg-white" : "bg-sky-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {notification.type}
            </span>
            <span className="text-xs text-slate-400">{formatDateTimeVi(notification.createdAt)}</span>
          </div>
        </div>

        {!notification.isRead ? (
          <button
            type="button"
            onClick={() => onMarkAsRead(notification._id)}
            disabled={loading}
            className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {loading ? "Dang luu..." : "Da doc"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminTopbar({ title, description, currentUser }) {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const currentName = currentUser?.fullName || "Admin BETOURIST";
  const {
    notificationCount,
    logout,
    refreshNotifications,
  } = useAppContext();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [loadingKey, setLoadingKey] = useState("");

  useEffect(() => {
    if (!isNotificationOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationOpen]);

  async function loadNotifications() {
    setIsNotificationLoading(true);
    setNotificationError("");

    try {
      const result = await getMyNotifications({ limit: 8 });
      setNotifications(result.notifications || []);
      return result.notifications || [];
    } catch (error) {
      setNotificationError(error.message || "Khong tai duoc thong bao.");
      return [];
    } finally {
      setIsNotificationLoading(false);
    }
  }

  async function handleToggleNotifications() {
    const nextOpenState = !isNotificationOpen;
    setIsNotificationOpen(nextOpenState);

    if (nextOpenState) {
      await loadNotifications();
    }
  }

  async function handleMarkNotification(notificationId) {
    setLoadingKey(`notification-${notificationId}`);
    setNotificationError("");

    try {
      await markNotificationAsRead(notificationId);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      await refreshNotifications();
    } catch (error) {
      setNotificationError(error.message || "Khong cap nhat duoc thong bao.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleMarkAllNotifications() {
    setLoadingKey("notification-all");
    setNotificationError("");

    try {
      await markAllNotificationsAsRead();
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      await refreshNotifications();
    } catch (error) {
      setNotificationError(error.message || "Khong cap nhat duoc tat ca thong bao.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            <div className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Admin Workspace
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
              aria-expanded={isNotificationOpen}
              aria-haspopup="dialog"
            >
              <NotificationIcon />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[11px] font-semibold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </button>

            {isNotificationOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,420px)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Thong bao</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {notificationCount > 0
                        ? `${notificationCount} thong bao chua doc`
                        : "Ban da doc het thong bao"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllNotifications}
                    disabled={loadingKey === "notification-all" || notifications.length === 0}
                    className="text-sm font-semibold text-sky-700 transition hover:text-sky-900 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    {loadingKey === "notification-all" ? "Dang luu..." : "Danh dau tat ca la da doc"}
                  </button>
                </div>

                {notificationError ? (
                  <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                    {notificationError}
                  </div>
                ) : null}

                <div className="max-h-[420px] overflow-y-auto">
                  {isNotificationLoading ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      Dang tai thong bao...
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkNotification}
                        loading={loadingKey === `notification-${notification._id}`}
                      />
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                      Chua co thong bao nao trong he thong.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{currentName}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</p>
            </div>
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">
              {getInitials(currentName)}
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-rose-300 hover:text-rose-700"
            title="Dang xuat"
            aria-label="Dang xuat"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
