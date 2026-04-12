"use client";

import { formatVnd } from "@/utils/format";

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function BookingStatsRow({ bookings = [], summary = null }) {
  const totalBookings = summary?.totalBookings ?? bookings.length;
  const pendingBookings =
    summary?.pendingBookings ?? bookings.filter((item) => item.bookingStatus === "pending").length;
  const confirmedBookings =
    summary?.confirmedBookings ??
    bookings.filter((item) => item.bookingStatus === "confirmed").length;

  const actualRevenue = bookings.reduce((sum, booking) => {
    if (booking.paymentStatus === "paid") return sum + Number(booking.totalAmount || 0);
    if (booking.paymentStatus === "partially_paid") return sum + Number(booking.depositAmount || 0);
    return sum;
  }, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Tổng booking" value={totalBookings} />
      <StatCard label="Đang chờ" value={pendingBookings} />
      <StatCard label="Đã xác nhận" value={confirmedBookings} />
      <StatCard label="Doanh thu thực tế" value={formatVnd(actualRevenue)} />
    </div>
  );
}