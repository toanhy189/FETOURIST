"use client";

import { cn } from "@/utils/cn";
import { formatDateTimeVi } from "@/utils/format";

function NotificationCard({ notification, onMarkRead, loading }) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-5 shadow-sm transition",
        notification.isRead
          ? "border-slate-200 bg-white"
          : "border-amber-200 bg-amber-50/70"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-sky-700">
            {notification.type}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {notification.title}
          </h3>
        </div>

        {!notification.isRead ? (
          <button
            type="button"
            onClick={() => onMarkRead(notification._id)}
            disabled={loading}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:bg-slate-100"
          >
            Đã đọc
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
      <p className="mt-3 text-xs text-slate-400">
        {formatDateTimeVi(notification.createdAt)}
      </p>
    </div>
  );
}

export default function NotificationTab({
  notifications,
  loading,
  handleMarkNotification,
  handleMarkAllNotifications,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Thông báo</h3>
        </div>

        <button
          type="button"
          onClick={handleMarkAllNotifications}
          disabled={loading.notificationAll}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100"
        >
          Đọc tất cả
        </button>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkNotification}
              loading={loading[`notification-${notification._id}`]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-base font-medium text-slate-700">Chưa có thông báo nào</p>
          <p className="mt-2 text-sm text-slate-500">
            Các thông báo liên quan đến booking và thanh toán sẽ hiện ở đây.
          </p>
        </div>
      )}
    </div>
  );
}