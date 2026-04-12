"use client";

import { formatVnd } from "@/utils/format";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getBookingStatusClass(status) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "completed":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    case "cancelled":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }
}

function getPaymentStatusClass(status) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "partially_paid":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    case "refunded":
    case "failed":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

export default function BookingListCard({
  bookings = [],
  selectedOrderCode,
  keyword,
  onKeywordChange,
  onView,
  onEdit,
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      {/* <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">Danh sách booking ({bookings.length})</h3>
        <input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm theo mã, tour, khách hàng..."
          className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        />
      </div> */}

      <div className="max-h-[720px] space-y-4 overflow-y-auto p-6">
        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Không có booking phù hợp.
          </div>
        ) : (
          bookings.map((booking) => {
            const isActive = selectedOrderCode === booking.orderCode;

            return (
              <article
                key={booking._id || booking.orderCode}
                className={cn(
                  "rounded-[26px] border bg-white p-5 shadow-sm transition-all",
                  isActive ? "border-sky-300 ring-4 ring-sky-100" : "border-slate-200 hover:shadow-md"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                        {booking.orderCode}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                          getBookingStatusClass(booking.bookingStatus)
                        )}
                      >
                        {booking.bookingStatus}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                          getPaymentStatusClass(booking.paymentStatus)
                        )}
                      >
                        {booking.paymentStatus}
                      </span>
                    </div>

                    <h4 className="mt-3 text-lg font-semibold text-slate-900">
                      {booking.tour?.title || "Chưa có tên tour"}
                    </h4>

                    <div className="mt-3 grid gap-3 text-sm text-slate-500 md:grid-cols-3">
                      <p>
                        <span className="font-medium text-slate-700">Khách:</span>{" "}
                        {booking.user?.fullName || "--"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Thanh toán:</span>{" "}
                        {booking.paymentMethod || "--"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Tổng tiền:</span>{" "}
                        <span className="font-semibold text-slate-900">
                          {formatVnd(booking.totalAmount || 0)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onView(booking)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(booking)}
                      className="rounded-2xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
                    >
                      Sửa
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}