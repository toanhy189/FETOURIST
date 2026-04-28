"use client";

import Link from "next/link";
import { formatVnd } from "@/utils/format";

function StatCard({ label, value, accent = "slate" }) {
  const accents = {
    slate: "bg-slate-50 text-slate-900",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl p-4 ${accents[accent] || accents.slate}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function RecentBookingCard({ booking, onOpenBooking, onSwitchToBooking }) {
  return (
    <button
      type="button"
      onClick={() => {
        onSwitchToBooking();
        onOpenBooking(booking.orderCode);
      }}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-200 hover:shadow-sm"
    >
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{booking.orderCode}</p>
        <p className="truncate text-sm text-slate-500">{booking.tour?.title}</p>
      </div>
      <p className="ml-3 shrink-0 text-sm font-semibold text-sky-800">
        {formatVnd(booking.totalAmount)}
      </p>
    </button>
  );
}

function RecentTourCard({ tour }) {
  return (
    <Link
      href={`/tour/${tour.slug}`}
      className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-200 hover:shadow-sm"
    >
      <p className="font-semibold text-slate-900">{tour.title}</p>
      <p className="text-sm text-slate-500">{tour.destination}</p>
    </Link>
  );
}

export default function OverviewTab({
  history,
  favorites,
  notificationCount,
  recentTours,
  isAdmin,
  openBooking,
  setActiveTab,
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={history.summary?.totalBookings || 0}
          accent="slate"
        />
        <StatCard
          label="Booking sắp tới"
          value={history.summary?.upcomingBookings || 0}
          accent="sky"
        />
        <StatCard
          label="Yêu thích"
          value={favorites.length}
          accent="amber"
        />
        <StatCard
          label="Thông báo chưa đọc"
          value={notificationCount}
          accent="emerald"
        />
      </div>

      {isAdmin ? (
        <div className="flex justify-end">
          <Link
            href="/admin"
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800"
          >
            Mở quản trị
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-2xl font-bold text-slate-900">Booking gần đây</h3>

          <div className="mt-4 space-y-3">
            {history.bookings?.length > 0 ? (
              history.bookings.slice(0, 3).map((booking) => (
                <RecentBookingCard
                  key={booking._id}
                  booking={booking}
                  onOpenBooking={openBooking}
                  onSwitchToBooking={() => setActiveTab("booking")}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-sm text-slate-500">Chưa có booking nào gần đây.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-2xl font-bold text-slate-900">Tour đã xem gần đây</h3>
          <div className="mt-4 space-y-3">
            {recentTours.length > 0 ? (
              recentTours.slice(0, 4).map((tour) => (
                <RecentTourCard key={tour.slug} tour={tour} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-sm text-slate-500">
                  Chưa có tour nào được lưu trong recent views.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}