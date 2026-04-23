"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";
import {
  BOOKING_STATUSES,
  PAYMENT_METHODS,
  getPaymentMethodLabel,
  getBookingStatusLabel,
} from "./bookingConstants";

const initialCreateForm = {
  userId: "",
  tourId: "",
  departureId: "",
  adults: 2,
  children: 0,
  infants: 0,
  fullName: "",
  email: "",
  phoneNumber: "",
  paymentMethod: "cash",
  bookingStatus: "pending",
};

function InputLabel({ label, required = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
    </label>
  );
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

export default function CreateBookingModal({
  open,
  onClose,
  users,
  tours,
  departures,
  onLoadDepartures,
  onSubmit,
}) {
  const [form, setForm] = useState(initialCreateForm);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(initialCreateForm);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BookingModal open={open} onClose={onClose} title="Tạo booking" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <InputLabel label="Người dùng" required />
          <FormSelect
            value={form.userId}
            onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
            required
          >
            <option value="">Chọn user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} - {user.email}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <InputLabel label="Tour" required />
          <FormSelect
            value={form.tourId}
            onChange={async (event) => {
              const nextTourId = event.target.value;
              setForm((prev) => ({ ...prev, tourId: nextTourId, departureId: "" }));
              await onLoadDepartures(nextTourId);
            }}
            required
          >
            <option value="">Chọn tour</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.title}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <InputLabel label="Lịch khởi hành" required />
          <FormSelect
            value={form.departureId}
            onChange={(event) => setForm((prev) => ({ ...prev, departureId: event.target.value }))}
            required
          >
            <option value="">Chọn departure</option>
            {departures.map((departure) => (
              <option key={departure.id} value={departure.id}>
                {new Date(departure.departureDate).toLocaleDateString("vi-VN")} - {departure.status}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <InputLabel label="Người lớn" />
            <FormInput
              type="number"
              min="1"
              value={form.adults}
              onChange={(event) => setForm((prev) => ({ ...prev, adults: event.target.value }))}
            />
          </div>
          <div>
            <InputLabel label="Trẻ em" />
            <FormInput
              type="number"
              min="0"
              value={form.children}
              onChange={(event) => setForm((prev) => ({ ...prev, children: event.target.value }))}
            />
          </div>
          <div>
            <InputLabel label="Em bé" />
            <FormInput
              type="number"
              min="0"
              value={form.infants}
              onChange={(event) => setForm((prev) => ({ ...prev, infants: event.target.value }))}
            />
          </div>
        </div>

        <div>
          <InputLabel label="Họ tên liên hệ" />
          <FormInput
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <InputLabel label="Email liên hệ" />
            <FormInput
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <div>
            <InputLabel label="Số điện thoại" />
            <FormInput
              value={form.phoneNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <InputLabel label="Phương thức thanh toán" />
            <FormSelect
              value={form.paymentMethod}
              onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </FormSelect>
          </div>
          <div>
            <InputLabel label="Trạng thái booking" />
            <FormSelect
              value={form.bookingStatus}
              onChange={(event) => setForm((prev) => ({ ...prev, bookingStatus: event.target.value }))}
            >
              {BOOKING_STATUSES.filter((item) => item === "pending" || item === "confirmed").map((status) => (
                <option key={status} value={status}>
                  {getBookingStatusLabel(status)}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
          >
            {submitting ? "Đang tạo..." : "Tạo booking"}
          </button>
        </div>
      </form>
    </BookingModal>
  );
}