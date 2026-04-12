"use client";

import BookingModal from "./BookingModal";
import { TRANSACTION_STATUSES } from "./bookingConstants";
import { formatDateVi, formatVnd } from "@/utils/format";

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
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "partially_paid":
    case "processing":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    case "refunded":
    case "failed":
    case "cancelled":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

export default function BookingDetailModal({
  open,
  booking,
  onClose,
  onUpdateTransaction,
}) {
  return (
    <BookingModal
      open={open}
      onClose={onClose}
      title={booking ? `Chi tiết ${booking.orderCode}` : "Chi tiết booking"}
      size="xl"
    >
      {!booking ? null : (
        <div className="space-y-6">
          <div className="rounded-[24px] bg-slate-900 p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{booking.orderCode}</p>
                <h4 className="mt-2 text-xl font-bold">{booking.tour?.title || "--"}</h4>
                <p className="mt-2 text-sm text-slate-300">
                  {booking.user?.fullName || "--"} • {booking.user?.email || "Không có email"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-slate-300">Tổng tiền booking</p>
                <p className="mt-2 text-2xl font-bold">{formatVnd(booking.totalAmount || 0)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Khởi hành</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatDateVi(booking.departureDate)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Trạng thái</p>
              <div className="mt-2 flex flex-wrap gap-2">
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
            </div>
          </div>

          <section className="space-y-3">
            <h4 className="text-base font-semibold text-slate-900">Giao dịch thanh toán</h4>

            {(booking.paymentTransactions || []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Chưa có giao dịch thanh toán.
              </div>
            ) : (
              (booking.paymentTransactions || []).map((transaction) => (
                <div
                  key={transaction._id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.transactionCode}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.method} • {transaction.status}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                        getPaymentStatusClass(transaction.status)
                      )}
                    >
                      {transaction.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {TRANSACTION_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onUpdateTransaction(transaction._id, status)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          status === transaction.status
                            ? "bg-slate-900 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </BookingModal>
  );
}