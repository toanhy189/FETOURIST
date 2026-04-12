"use client";

import { useEffect, useMemo, useState } from "react";
import BookingModal from "./BookingModal";
import {
  BOOKING_STATUS_TRANSITIONS,
  PAYMENT_METHODS,
} from "./bookingConstants";

function InputLabel({ label }) {
  return <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>;
}

function FormInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  );
}

function FormSelect(props) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  );
}

function FormTextarea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  );
}

export default function UpdateBookingModal({
  open,
  booking,
  onClose,
  onSaveInfo,
  onSaveStatus,
  onDelete,
}) {
  const [form, setForm] = useState({
    paymentMethod: "cash",
    depositAmount: "",
    note: "",
    specialRequest: "",
    bookingStatus: "pending",
    cancellationReason: "",
  });

  useEffect(() => {
    if (!booking) return;
    setForm({
      paymentMethod: booking.paymentMethod || "cash",
      depositAmount: booking.depositAmount || "",
      note: booking.note || "",
      specialRequest: booking.specialRequest || "",
      bookingStatus: booking.bookingStatus || "pending",
      cancellationReason: booking.cancellationReason || "",
    });
  }, [booking]);

  const availableStatuses = useMemo(() => {
    if (!booking?.bookingStatus) return [];
    return [booking.bookingStatus, ...(BOOKING_STATUS_TRANSITIONS[booking.bookingStatus] || [])];
  }, [booking]);

  if (!booking) return null;

  return (
    <BookingModal open={open} onClose={onClose} title={`Cập nhật ${booking.orderCode}`} size="lg">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <InputLabel label="Tiền cọc" />
            <FormInput
              type="number"
              min="0"
              value={form.depositAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, depositAmount: event.target.value }))}
            />
          </div>
          <div>
            <InputLabel label="Phương thức thanh toán" />
            <FormSelect
              value={form.paymentMethod}
              onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div>
          <InputLabel label="Yêu cầu đặc biệt" />
          <FormInput
            value={form.specialRequest}
            onChange={(event) => setForm((prev) => ({ ...prev, specialRequest: event.target.value }))}
          />
        </div>

        <div>
          <InputLabel label="Ghi chú" />
          <FormTextarea
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-base font-semibold text-slate-900">Trạng thái booking</h4>

          <div className="mt-4 space-y-4">
            <div>
              <InputLabel label="Booking status" />
              <FormSelect
                value={form.bookingStatus}
                onChange={(event) => setForm((prev) => ({ ...prev, bookingStatus: event.target.value }))}
              >
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </FormSelect>
            </div>

            {form.bookingStatus === "cancelled" ? (
              <div>
                <InputLabel label="Lý do hủy" />
                <FormInput
                  value={form.cancellationReason}
                  onChange={(event) => setForm((prev) => ({ ...prev, cancellationReason: event.target.value }))}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => onDelete(booking.orderCode)}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Xóa booking
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() =>
                onSaveInfo(booking.orderCode, {
                  paymentMethod: form.paymentMethod,
                  depositAmount: form.depositAmount === "" ? undefined : Number(form.depositAmount),
                  note: form.note,
                  specialRequest: form.specialRequest,
                })
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Lưu thông tin
            </button>
            <button
              type="button"
              onClick={() =>
                onSaveStatus(booking.orderCode, {
                  bookingStatus: form.bookingStatus,
                  cancellationReason: form.bookingStatus === "cancelled" ? form.cancellationReason : undefined,
                })
              }
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Lưu trạng thái
            </button>
          </div>
        </div>
      </div>
    </BookingModal>
  );
}