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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17H5.8a1 1 0 0 1-.8-1.6l1.4-1.9a4.5 4.5 0 0 0 .9-2.7V9.9a4.7 4.7 0 1 1 9.4 0v.9a4.5 4.5 0 0 0 .9 2.7" />
      <path d="M9.5 20a2.4 2.4 0 0 0 4.3 0" />
      <path d="M18 8.5a2.7 2.7 0 0 1 0 5.3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 16l4-4-4-4" />
      <path d="M14 12H4" />
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
      className={`border-b border-slate-200 px-5 py-4 transition ${notification.isRead ? "bg-white" : "bg-sky-50/60"
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

export default function AdminTopbar({
  title,
  description,
  currentUser,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const currentName = currentUser?.fullName || "Admin TRAVELPTIT";
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
    refreshNotifications();

    const intervalId = window.setInterval(() => {
      refreshNotifications();

      if (isNotificationOpen) {
        loadNotifications();
      }
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isNotificationOpen, refreshNotifications]);

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
      setNotificationError(error.message || "Không tải được thông báo");
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
      setNotificationError(error.message || "Không cập nhật được thông báo");
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
      setNotificationError(error.message || "Không cập nhật được tất cả thông báo");
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
    <header className="sticky top-0 z-20 border-b border-[#cfdbed] bg-[#dfe9f8]/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-slate-700 shadow-sm transition ${isSidebarOpen
                ? "border-[#c1d1e8] bg-white text-slate-900"
                : "border-transparent bg-white/75 hover:border-[#c1d1e8] hover:bg-white"
              }`}
            aria-label={isSidebarOpen ? "Đóng sidebar" : "Mở sidebar"}
            aria-pressed={isSidebarOpen}
          >
            <MenuIcon />
          </button>


        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white/90 text-slate-600 shadow-sm transition ${isNotificationOpen
                  ? "border-sky-300 text-sky-800"
                  : "border-[#c9d8eb] hover:border-sky-300 hover:text-sky-800"
                }`}
              aria-expanded={isNotificationOpen}
              aria-haspopup="dialog"
              aria-label="Thông báo"
            >
              <NotificationIcon />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold text-white shadow-sm">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </button>

            {isNotificationOpen ? (
              <div className="absolute right-0 top-[calc(100%+14px)] z-30 w-[min(92vw,420px)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Thông báo</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {notificationCount > 0
                        ? `${notificationCount} thông báo chưa đọc`
                        : "Bạn đã đọc hết thông báo"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllNotifications}
                    disabled={loadingKey === "notification-all" || notifications.length === 0}
                    className="text-sm font-semibold text-sky-700 transition hover:text-sky-900 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    {loadingKey === "notification-all" ? "Đang lưu..." : "Đánh dấu tất cả là đã đọc"}
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
                      Đang tải thông báo...
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
                      Chưa có thông báo nào trong hệ thống
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-[#f3c18d] via-[#f6d6af] to-[#d7e5f8] text-sm font-semibold text-slate-800 shadow-sm">
            {getInitials(currentName)}
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#dfe9f8] bg-emerald-500" />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9d8eb] bg-white/90 text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
