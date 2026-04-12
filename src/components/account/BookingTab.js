"use client";

import { formatDateVi, formatVnd } from "@/utils/format";
import { cn } from "@/utils/cn";

function StatusBadge({ children, tone = "slate" }) {
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
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize",
        styles[tone] || styles.slate
      )}
    >
      {children}
    </span>
  );
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
            <StatusBadge tone="sky">{booking.bookingStatus}</StatusBadge>
            <StatusBadge tone="amber">{booking.paymentStatus}</StatusBadge>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-400">Tổng thanh toán</p>
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

function TransferGuide({ amount }) {
  return (
    <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-5">
      <h4 className="text-base font-semibold text-slate-900">Hướng dẫn chuyển khoản</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Sau khi chuyển khoản, hệ thống sẽ tự động hoặc thủ công đối soát và cập nhật trạng thái thanh toán cho booking của bạn.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Ngân hàng</p>
          <p className="mt-2 font-semibold text-slate-900">Vietcombank</p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Số tài khoản</p>
          <p className="mt-2 font-semibold text-slate-900">0123 456 789</p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Chủ tài khoản</p>
          <p className="mt-2 font-semibold text-slate-900">BETOURIST TRAVEL</p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Số tiền gợi ý</p>
          <p className="mt-2 font-semibold text-slate-900">{formatVnd(amount || 0)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Nội dung chuyển khoản</p>
        <p className="mt-2 break-all text-sm font-semibold text-sky-800">
          THANH TOAN BOOKING
        </p>
      </div>
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
        <p className="text-base font-medium text-slate-700">Chọn 1 booking để xem chi tiết</p>
        <p className="mt-2 text-sm text-slate-500">
          Thông tin booking và lựa chọn thanh toán sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  const payableAmount =
    paymentForm.amount && !Number.isNaN(Number(paymentForm.amount))
      ? Number(paymentForm.amount)
      : selectedPaymentDetail?.paymentOverview?.remainingAmount || selectedBooking.totalAmount || 0;

  const isBankTransfer = paymentForm.method === "bank_transfer";

  return (
    <div className="space-y-4">
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
              <StatusBadge tone="sky">{selectedBooking.bookingStatus}</StatusBadge>
              <StatusBadge tone="amber">{selectedBooking.paymentStatus}</StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleCreatePayment}
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
      >
        <div>
          <h4 className="text-base font-semibold text-slate-900">Thanh toán booking</h4>
          <p className="mt-1 text-sm text-slate-500">
            Chọn phương thức phù hợp để hoàn tất hoặc đặt cọc cho booking của bạn.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <select
            value={paymentForm.method}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                method: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
          >
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="credit_card">Thẻ tín dụng</option>
            <option value="e_wallet">Ví điện tử</option>
            <option value="momo">MoMo</option>
            <option value="zalopay">ZaloPay</option>
            <option value="vnpay">VNPay</option>
          </select>

          <select
            value={paymentForm.transactionType}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                transactionType: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
          >
            <option value="full_payment">Thanh toán toàn bộ</option>
            <option value="deposit">Thanh toán cọc</option>
          </select>

          <input
            value={paymentForm.amount}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
            placeholder="Nhập số tiền nếu muốn thanh toán một phần"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
          />

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Số tiền thanh toán</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatVnd(payableAmount)}</p>
          </div>

          <button
            type="submit"
            disabled={createPaymentLoading}
            className="rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {createPaymentLoading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
          </button>
        </div>
      </form>

      {isBankTransfer ? <TransferGuide amount={payableAmount} /> : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <h4 className="text-base font-semibold text-slate-900">Cập nhật trạng thái</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sau khi bạn hoàn tất thanh toán, hệ thống sẽ cập nhật trạng thái giao dịch của booking này.
        </p>
      </div>

      <PaymentOverview detail={selectedPaymentDetail} />
    </div>
  );
}

export default function BookingTab({
  bookings,
  loading,
  selectedBooking,
  selectedPaymentDetail,
  paymentForm,
  setPaymentForm,
  openBooking,
  handleCreatePayment,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
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
              Khi người dùng đặt tour, danh sách sẽ hiển thị ở đây.
            </p>
          </div>
        )}
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
  );
}