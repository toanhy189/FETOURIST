"use client";

import { useEffect, useMemo, useState } from "react";
import BookingModal from "./BookingModal";
import { formatDateVi, formatVnd } from "@/utils/format";
import {
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  BOOKING_STATUS_TRANSITIONS,
  getBookingStatusLabel,
  getTransactionStatusLabel,
  getPaymentStatusLabel,
  DEPARTURE_STATUS_LABELS,
  getDepartureStatusLabel
} from "./bookingConstants";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getPaymentMethodLabel(method) {
  switch (method) {
    case "cash":
      return "Tiền mặt";
    case "vnpay":
      return "VNPay";
    default:
      return method || "--";
  }
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

function InputLabel({ label, helper }) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function FormInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
    />
  );
}

function FormSelect({ className = "", ...props }) {
  return (
    <select
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
    />
  );
}

function FormTextarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
    />
  );
}

function SectionCard({ title, children, className = "" }) {
  return (
    <section className={cn("rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function formatDateSafe(value) {
  return value ? formatDateVi(value) : "--";
}

const initialForm = {
  tourId: "",
  departureId: "",
  adults: 1,
  children: 0,
  infants: 0,
  contactFullName: "",
  contactEmail: "",
  contactPhoneNumber: "",
  paymentMethod: "cash",
  depositAmount: "",
  specialRequest: "",
  note: "",
  bookingStatus: "pending",
  cancellationReason: "",
};

export default function UpdateBookingModal({
  open,
  booking,
  tours = [],
  departures = [],
  onLoadDepartures,
  onClose,
  onSaveInfo,
  onSaveStatus,
  onDelete,
  onUpdateTransaction,
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open || !booking) return;

    const nextTourId = booking.tour?._id || booking.tour?.id || "";
    const nextDepartureId = booking.departure?._id || booking.departure?.id || "";

    setForm({
      tourId: nextTourId,
      departureId: nextDepartureId,
      adults: booking.guests?.adults ?? 1,
      children: booking.guests?.children ?? 0,
      infants: booking.guests?.infants ?? 0,
      contactFullName: booking.contactInfo?.fullName || booking.user?.fullName || "",
      contactEmail: booking.contactInfo?.email || booking.user?.email || "",
      contactPhoneNumber:
        booking.contactInfo?.phoneNumber || booking.user?.phoneNumber || "",
      paymentMethod: booking.paymentMethod || "cash",
      depositAmount: booking.depositAmount ?? "",
      specialRequest: booking.specialRequest || "",
      note: booking.note || "",
      bookingStatus: booking.bookingStatus || "pending",
      cancellationReason: booking.cancellationReason || "",
    });

    if (nextTourId && onLoadDepartures) {
      void onLoadDepartures(nextTourId);
    }
  }, [open, booking, onLoadDepartures]);

  const availableStatuses = useMemo(() => {
    if (!booking?.bookingStatus) return [];
    return Array.from(
      new Set([
        booking.bookingStatus,
        ...(BOOKING_STATUS_TRANSITIONS[booking.bookingStatus] || []),
      ])
    );
  }, [booking]);

  const totalGuests =
    Number(form.adults || 0) +
    Number(form.children || 0) +
    Number(form.infants || 0);

  const [savingAll, setSavingAll] = useState(false);

  const paidAmount = Number(booking?.paymentSummary?.paidAmount || 0);
  const remainingAmount = Number(booking?.paymentSummary?.remainingAmount || 0);

  const disableTravelFields =
    booking?.bookingStatus === "cancelled" || booking?.paymentStatus === "paid";

  if (!booking) return null;

  async function handleSaveAll() {
    setSavingAll(true);

    try {
      const infoPayload = {
        contactInfo: {
          fullName: form.contactFullName,
          email: form.contactEmail,
          phoneNumber: form.contactPhoneNumber,
        },
        paymentMethod: form.paymentMethod,
        depositAmount: form.depositAmount === "" ? 0 : Number(form.depositAmount),
        specialRequest: form.specialRequest,
        note: form.note,
      };

      if (!disableTravelFields) {
        infoPayload.departureId = form.departureId || undefined;
        infoPayload.guests = {
          adults: Number(form.adults),
          children: Number(form.children),
          infants: Number(form.infants),
        };
      }

      await onSaveInfo(booking.orderCode, infoPayload);

      await onSaveStatus(booking.orderCode, {
        bookingStatus: form.bookingStatus,
        cancellationReason:
          form.bookingStatus === "cancelled"
            ? form.cancellationReason
            : undefined,
      });
    } catch {
      // Parent shows the centered status dialog with the backend error message.
    } finally {
      setSavingAll(false);
    }
  }

  return (
    <BookingModal
      open={open}
      onClose={onClose}
      title={`Cập nhật ${booking.orderCode}`}
      size="xl"
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-300">
                {booking.orderCode}
              </p>
              <h3 className="mt-3 text-2xl font-bold leading-tight text-white">
                {booking.tour?.title || "--"}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getBookingStatusClass(booking.bookingStatus)
                  )}
                >
                  {getBookingStatusLabel(booking.bookingStatus)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getPaymentStatusClass(booking.paymentStatus)
                  )}
                >
                  {getPaymentStatusLabel(booking.paymentStatus)}
                </span>
              </div>
            </div>

            <div className="min-w-[250px] rounded-[22px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <div className="grid gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-300">Tổng tiền</div>
                  <div className="mt-1 text-2xl font-bold">{formatVnd(booking.totalAmount || 0)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-300">Đã thanh toán</div>
                    <div className="mt-1 font-semibold text-white">{formatVnd(paidAmount)}</div>
                  </div>
                  <div>
                    <div className="text-slate-300">Còn lại</div>
                    <div className="mt-1 font-semibold text-white">{formatVnd(remainingAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Lịch khởi hành">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InputLabel
                  label="Tour"
                  helper={
                    booking?.bookingStatus === "cancelled"
                      ? "Booking đã hủy nên không thể đổi lịch hoặc số lượng khách."
                      : booking?.paymentStatus === "paid"
                        ? "Booking đã thanh toán đủ nên không thể đổi lịch hoặc số lượng khách."
                        : undefined
                  }
                />
                <FormSelect
                  value={form.tourId}
                  disabled={disableTravelFields}
                  onChange={async (event) => {
                    const nextTourId = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      tourId: nextTourId,
                      departureId: "",
                    }));
                    if (onLoadDepartures) {
                      await onLoadDepartures(nextTourId);
                    }
                  }}
                >
                  <option value="">Chọn tour</option>
                  {tours.map((tour) => (
                    <option key={tour.id || tour._id} value={tour.id || tour._id}>
                      {tour.title}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="sm:col-span-2">
                <InputLabel label="Đợt khởi hành" />
                <FormSelect
                  value={form.departureId}
                  disabled={disableTravelFields}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, departureId: event.target.value }))
                  }
                >
                  <option value="">Chọn đợt khởi hành</option>
                  {departures.map((departure) => (
                    <option key={departure.id || departure._id} value={departure.id || departure._id}>
                      {formatDateSafe(departure.departureDate)} - {getDepartureStatusLabel(departure.status)}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <InputLabel label="Ngày khởi hành hiện tại" />
                <FormInput value={formatDateSafe(booking.departureDate)} disabled />
              </div>

              <div>
                <InputLabel label="Ngày tạo đơn" />
                <FormInput value={formatDateSafe(booking.createdAt)} disabled />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Hành khách">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel label="Người lớn" />
                <FormInput
                  type="number"
                  min="1"
                  disabled={disableTravelFields}
                  value={form.adults}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, adults: event.target.value }))
                  }
                />
              </div>

              <div>
                <InputLabel label="Trẻ em" />
                <FormInput
                  type="number"
                  min="0"
                  disabled={disableTravelFields}
                  value={form.children}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, children: event.target.value }))
                  }
                />
              </div>

              <div>
                <InputLabel label="Em bé" />
                <FormInput
                  type="number"
                  min="0"
                  disabled={disableTravelFields}
                  value={form.infants}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, infants: event.target.value }))
                  }
                />
              </div>

              <div>
                <InputLabel label="Tổng số khách" />
                <FormInput value={String(totalGuests)} disabled />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Thông tin liên hệ">
            <div className="grid gap-4">
              <div>
                <InputLabel label="Họ tên liên hệ" />
                <FormInput
                  value={form.contactFullName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contactFullName: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <InputLabel label="Email" />
                  <FormInput
                    type="email"
                    value={form.contactEmail}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <InputLabel label="Số điện thoại" />
                  <FormInput
                    value={form.contactPhoneNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        contactPhoneNumber: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Thanh toán và ghi chú">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <InputLabel label="Phương thức thanh toán" />
                  <FormSelect
                    value={form.paymentMethod}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {getPaymentMethodLabel(method)}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <InputLabel label="Tiền cọc" />
                  <FormInput
                    type="number"
                    min="0"
                    value={form.depositAmount}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, depositAmount: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <InputLabel label="Yêu cầu đặc biệt" />
                <FormInput
                  value={form.specialRequest}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, specialRequest: event.target.value }))
                  }
                />
              </div>

              <div>
                <InputLabel label="Ghi chú" />
                <FormTextarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Trạng thái booking" className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
              <div>
                <InputLabel label="Trạng thái hiện tại" />
                <FormSelect
                  value={form.bookingStatus}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, bookingStatus: event.target.value }))
                  }
                >
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getBookingStatusLabel(status)}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <InputLabel label="Lý do huỷ" />
                <FormInput
                  disabled={form.bookingStatus !== "cancelled"}
                  value={form.cancellationReason}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      cancellationReason: event.target.value,
                    }))
                  }
                  placeholder="Nhập lý do huỷ nếu chuyển sang trạng thái huỷ"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Giao dịch thanh toán" className="xl:col-span-2">
            {(booking.paymentTransactions || []).length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chưa có giao dịch thanh toán để cập nhật.
              </div>
            ) : (
              <div className="space-y-4">
                {(booking.paymentTransactions || []).map((transaction) => (
                  <div
                    key={transaction._id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-slate-900">
                          {transaction.transactionCode || "--"}
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                              Phương thức
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {getPaymentMethodLabel(transaction.method)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                              Trạng thái
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {getTransactionStatusLabel(transaction.status)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                              Số tiền
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {transaction.amount != null ? formatVnd(transaction.amount) : "--"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                              Thời gian
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {formatDateSafe(transaction.paidAt || transaction.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          getPaymentStatusClass(transaction.status)
                        )}
                      >
                        {getTransactionStatusLabel(transaction.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {TRANSACTION_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={!onUpdateTransaction || status === transaction.status}
                          onClick={() => onUpdateTransaction(transaction._id, status)}
                          className={cn(
                            "rounded-full px-3 py-2 text-xs font-semibold transition",
                            status === transaction.status
                              ? "bg-slate-900 text-white"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                        >
                          {getTransactionStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onDelete(booking.orderCode)}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Xóa booking
          </button>

          <button
            type="button"
            disabled={savingAll}
            onClick={handleSaveAll}
            className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingAll ? "Đang lưu..." : "Lưu cập nhật"}
          </button>
        </div>
      </div>
    </BookingModal>
  );
}
