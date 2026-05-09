"use client";

import { formatDateTimeVi, formatDateVi, formatVnd } from "@/utils/format";
import { cn } from "@/utils/cn";

const BOOKING_STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Chờ thanh toán",
  partially_paid: "Thanh toán một phần",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
  failed: "Thanh toán thất bại",
};

const TRANSACTION_STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  success: "Thành công",
  failed: "Thất bại",
  cancelled: "Đã hủy",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Tiền mặt",
  vnpay: "VNPay"
};

const TRANSACTION_TYPE_LABELS = {
  full_payment: "Thanh toán toàn bộ",
  deposit: "Thanh toán cọc",
  refund: "Hoàn tiền",
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: PAYMENT_METHOD_LABELS.cash },
  { value: "vnpay", label: PAYMENT_METHOD_LABELS.vnpay },
];

const USER_TRANSACTION_TYPE_OPTIONS = [
  { value: "full_payment", label: TRANSACTION_TYPE_LABELS.full_payment },
  { value: "deposit", label: TRANSACTION_TYPE_LABELS.deposit },
];

function getBookingStatusLabel(status) {
  return BOOKING_STATUS_LABELS[status] || status || "--";
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status || "--";
}

function getTransactionStatusLabel(status) {
  return TRANSACTION_STATUS_LABELS[status] || status || "--";
}

function getPaymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || method || "--";
}

function getTransactionTypeLabel(type) {
  return TRANSACTION_TYPE_LABELS[type] || type || "--";
}

function SummaryCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-900",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className={cn("rounded-2xl p-4", tones[tone] || tones.slate)}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ label, tone = "slate" }) {
  const styles = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        styles[tone] || styles.slate
      )}
    >
      {label}
    </span>
  );
}

function getPaymentTone(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid" || normalized === "success") return "emerald";
  if (normalized === "partially_paid" || normalized === "processing" || normalized === "pending") return "amber";
  if (normalized === "failed" || normalized === "cancelled" || normalized === "refunded") return "rose";
  return "slate";
}

function getBookingTone(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "confirmed") return "sky";
  if (normalized === "completed") return "emerald";
  if (normalized === "cancelled") return "rose";
  return "amber";
}

function BookingItem({ booking, onOpen, isActive }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(booking.orderCode)}
      className={cn(
        "group w-full rounded-[1.5rem] border bg-white p-5 text-left transition",
        "hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_12px_30px_rgba(2,132,199,0.08)]",
        isActive ? "border-sky-300 shadow-[0_10px_25px_rgba(2,132,199,0.08)]" : "border-slate-200"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
            {booking.orderCode}
          </p>

          <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900 md:text-xl">
            {booking.tour?.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Khởi hành {formatDateVi(booking.departureDate)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge
              tone={getBookingTone(booking.bookingStatus)}
              label={getBookingStatusLabel(booking.bookingStatus)}
            />
            <StatusBadge
              tone={getPaymentTone(booking.paymentStatus)}
              label={getPaymentStatusLabel(booking.paymentStatus)}
            />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-400">Tổng tiền</p>
          <p className="mt-1 text-lg font-bold text-slate-900 md:text-xl">
            {formatVnd(booking.totalAmount)}
          </p>
          <p className="mt-3 text-sm font-semibold text-sky-700 group-hover:underline">
            Xem chi tiết
          </p>
        </div>
      </div>
    </button>
  );
}

function TransactionCard({ transaction }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-[0_12px_30px_rgba(2,132,199,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
            {transaction.transactionCode}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {transaction.booking?.orderCode ? `Booking ${transaction.booking.orderCode}` : "Giao dịch thanh toán"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {formatDateTimeVi(transaction.createdAt)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone="sky" label={getPaymentMethodLabel(transaction.method)} />
            <StatusBadge tone={getPaymentTone(transaction.status)} label={getTransactionStatusLabel(transaction.status)} />
            <StatusBadge tone="slate" label={getTransactionTypeLabel(transaction.transactionType)} />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-400">Số tiền</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatVnd(transaction.amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentOverview({ detail }) {
  if (!detail) return null;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <h4 className="text-base font-semibold text-slate-900">Tình trạng thanh toán</h4>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
            Đã thanh toán
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatVnd(detail.paymentOverview?.paidAmount || 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
            Còn lại
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatVnd(detail.paymentOverview?.remainingAmount || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}


function InfoCard({ title, children, className = "" }) {
  return (
    <div className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5", className)}>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900 break-words">{value || "--"}</p>
    </div>
  );
}

function BookingDetailPanel({
  loading,
  selectedBooking,
  selectedPaymentDetail,
  paymentForm,
  setPaymentForm,
  handleCreatePayment,
  createPaymentLoading,
}) {
  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        Đang tải chi tiết booking...
      </div>
    );
  }

  if (!selectedBooking) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-base font-medium text-slate-700">Chọn một booking để xem chi tiết</p>
        <p className="mt-2 text-sm text-slate-500">
          Thông tin booking và thanh toán sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  const paidAmount =
    selectedPaymentDetail?.paymentOverview?.paidAmount ??
    selectedBooking?.paymentSummary?.paidAmount ??
    0;

  const remainingAmount =
    selectedPaymentDetail?.paymentOverview?.remainingAmount ??
    selectedBooking?.paymentSummary?.remainingAmount ??
    Math.max(Number(selectedBooking.totalAmount || 0) - Number(paidAmount || 0), 0);

  const payableAmount =
    paymentForm.amount && !Number.isNaN(Number(paymentForm.amount))
      ? Number(paymentForm.amount)
      : remainingAmount || selectedBooking.totalAmount || 0;

  const isFullyPaid =
    selectedBooking?.paymentStatus === "paid" || Number(remainingAmount) <= 0;
  const isCancelled = selectedBooking?.bookingStatus === "cancelled";
  const canCreatePayment = !isFullyPaid && !isCancelled;
  const paymentButtonLabel =
    paymentForm.method === "vnpay" ? "Thanh toán qua VNPay" : "Gửi yêu cầu thanh toán";


  return (
    <div className="space-y-4 max-h-[820px] overflow-y-auto pr-2">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
        <div className="bg-gradient-to-br from-sky-600 to-cyan-500 px-5 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
            {selectedBooking.orderCode}
          </p>
          <h3 className="mt-2 text-xl font-bold md:text-2xl">
            {selectedBooking.tour?.title}
          </h3>
          <p className="mt-2 text-sm text-sky-50">
            Khởi hành {formatDateVi(selectedBooking.departureDate)}
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Tổng tiền</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatVnd(selectedBooking.totalAmount)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Trạng thái</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge
                tone={getBookingTone(selectedBooking.bookingStatus)}
                label={getBookingStatusLabel(selectedBooking.bookingStatus)}
              />
              <StatusBadge
                tone={getPaymentTone(selectedBooking.paymentStatus)}
                label={getPaymentStatusLabel(selectedBooking.paymentStatus)}
              />
            </div>
          </div>
        </div>
      </div>

      <InfoCard title="Thông tin booking">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Mã booking" value={selectedBooking.orderCode} />
          <DetailItem label="Ngày khởi hành" value={formatDateVi(selectedBooking.departureDate)} />
          <DetailItem
            label="Ngày tạo"
            value={selectedBooking.createdAt ? formatDateTimeVi(selectedBooking.createdAt) : "--"}
          />
          <DetailItem
            label="Điểm tập trung"
            value={selectedBooking.departure?.meetingPoint || "--"}
          />
          <DetailItem
            label="Trạng thái booking"
            value={getBookingStatusLabel(selectedBooking.bookingStatus)}
          />
          <DetailItem
            label="Trạng thái thanh toán"
            value={getPaymentStatusLabel(selectedBooking.paymentStatus)}
          />
        </div>
      </InfoCard>

      <InfoCard title="Thông tin liên hệ">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Họ tên liên hệ"
            value={selectedBooking.contactInfo?.fullName || "--"}
          />
          <DetailItem
            label="Số điện thoại"
            value={selectedBooking.contactInfo?.phoneNumber || "--"}
          />
          <DetailItem
            label="Email"
            value={selectedBooking.contactInfo?.email || "--"}
            full
          />
        </div>
      </InfoCard>

      <InfoCard title="Hành khách">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Người lớn" value={selectedBooking.guests?.adults ?? 0} />
          <DetailItem label="Trẻ em" value={selectedBooking.guests?.children ?? 0} />
          <DetailItem label="Em bé" value={selectedBooking.guests?.infants ?? 0} />
          <DetailItem
            label="Tổng số khách"
            value={
              Number(selectedBooking.guests?.adults || 0) +
              Number(selectedBooking.guests?.children || 0) +
              Number(selectedBooking.guests?.infants || 0)
            }
          />
        </div>
      </InfoCard>

      <InfoCard title="Thanh toán">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Tổng tiền" value={formatVnd(selectedBooking.totalAmount || 0)} />
          <DetailItem label="Đã thanh toán" value={formatVnd(paidAmount || 0)} />
          <DetailItem label="Còn lại" value={formatVnd(remainingAmount || 0)} />
          <DetailItem label="Tiền cọc" value={formatVnd(selectedBooking.depositAmount || 0)} />
        </div>
        {isFullyPaid ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-4">
            <p className="text-sm font-medium text-emerald-700">
              Booking này đã được thanh toán đầy đủ.
            </p>
          </div>
        ) : null}

        {isCancelled ? (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-4">
            <p className="text-sm font-medium text-rose-700">
              Booking đã hủy nên không thể tạo thanh toán.
            </p>
          </div>
        ) : null}

        {canCreatePayment ? (
          <form onSubmit={handleCreatePayment} className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Phương thức
                <select
                  value={paymentForm.method}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      method: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400"
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Loại thanh toán
                <select
                  value={paymentForm.transactionType}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      transactionType: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400"
                >
                  {USER_TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Số tiền thanh toán
              <input
                type="number"
                min={1}
                max={remainingAmount || selectedBooking.totalAmount || undefined}
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400"
                placeholder={` ${formatVnd(remainingAmount || selectedBooking.totalAmount || 0)}`}
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                Để trống nếu muốn thanh toán theo số tiền hệ thống đề xuất.
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

              <button
                type="submit"
                disabled={createPaymentLoading}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {createPaymentLoading ? "Đang tạo..." : paymentButtonLabel}
              </button>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              VNPay sẽ chuyển bạn sang cổng thanh toán. Tiền mặt sẽ tạo giao dịch chờ admin xác nhận.
            </p>
          </form>
        ) : null}
      </InfoCard>

      {(selectedBooking.specialRequest || selectedBooking.note || selectedBooking.cancellationReason) ? (
        <InfoCard title="Ghi chú">
          <div className="grid gap-4">
            {selectedBooking.specialRequest ? (
              <DetailItem
                label="Yêu cầu đặc biệt"
                value={selectedBooking.specialRequest}
                full
              />
            ) : null}

            {selectedBooking.note ? (
              <DetailItem
                label="Ghi chú"
                value={selectedBooking.note}
                full
              />
            ) : null}

            {selectedBooking.cancellationReason ? (
              <DetailItem
                label="Lý do hủy"
                value={selectedBooking.cancellationReason}
                full
              />
            ) : null}
          </div>
        </InfoCard>
      ) : null}


      {selectedPaymentDetail?.transactions?.length > 0 ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <h4 className="text-base font-semibold text-slate-900">Giao dịch của booking này</h4>
          <div className="mt-4 space-y-3">
            {selectedPaymentDetail.transactions.map((transaction) => (
              <TransactionCard key={transaction._id} transaction={transaction} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BookingTab({
  bookings,
  payments,
  loading,
  selectedBooking,
  selectedPaymentDetail,
  paymentForm,
  setPaymentForm,
  openBooking,
  handleCreatePayment,
}) {
  const transactions = payments?.transactions || [];
  const summary = payments?.summary || {};

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Tổng giao dịch"
          value={summary.totalTransactions || 0}
          tone="slate"
        />
        <SummaryCard
          label="Thành công"
          value={summary.successfulTransactions || 0}
          tone="emerald"
        />
        <SummaryCard
          label="Đang xử lý"
          value={summary.pendingTransactions || 0}
          tone="amber"
        />
        <SummaryCard
          label="Đã thanh toán"
          value={formatVnd(summary.netPaidAmount || 0)}
          tone="sky"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-6 max-h-[820px] overflow-y-auto pr-2">
          <div className="space-y-4">
            {bookings?.length > 0 ? (
              bookings.map((booking) => (
                <BookingItem
                  key={booking._id}
                  booking={booking}
                  onOpen={openBooking}
                  isActive={selectedBooking?.orderCode === booking.orderCode}
                />
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-base font-medium text-slate-700">Chưa có booking nào</p>
                <p className="mt-2 text-sm text-slate-500">
                  Khi bạn đặt tour, danh sách booking sẽ hiển thị ở đây.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <BookingDetailPanel
            loading={loading.bookingDetail}
            selectedBooking={selectedBooking}
            selectedPaymentDetail={selectedPaymentDetail}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            handleCreatePayment={handleCreatePayment}
            createPaymentLoading={loading.createPayment}
          />
        </div>
      </div>
    </div>
  );
}
