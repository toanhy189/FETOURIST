"use client";

import BookingModal from "./BookingModal";
import { formatDateVi, formatVnd } from "@/utils/format";
import {
  getBookingStatusLabel,
  getPaymentStatusLabel,
  getTransactionStatusLabel,
} from "./bookingConstants";

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

function formatDateSafe(value) {
  return value ? formatDateVi(value) : "--";
}

function getTotalGuests(booking) {
  const adults = Number(booking?.guests?.adults || 0);
  const children = Number(booking?.guests?.children || 0);
  const infants = Number(booking?.guests?.infants || 0);
  return adults + children + infants;
}

function InfoCard({ title, children, className = "" }) {
  return (
    <section className={cn("rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoGrid({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function InfoItem({ label, value, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900 break-words">{value || "--"}</div>
    </div>
  );
}

export default function BookingDetailModal({
  open,
  booking,
  onClose,
}) {
  return (
    <BookingModal
      open={open}
      onClose={onClose}
      title={booking ? `Chi tiết ${booking.orderCode}` : "Chi tiết booking"}
      size="xl"
    >
      {!booking ? null : (
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

              <div className="min-w-[220px] rounded-[22px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <div className="text-xs uppercase tracking-wide text-slate-300">Tổng tiền</div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {formatVnd(booking.totalAmount || 0)}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Đặt cọc: {formatVnd(booking.depositAmount || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <InfoCard title="Thông tin booking">
              <InfoGrid>
                <InfoItem label="Mã booking" value={booking.orderCode} />
                <InfoItem label="Ngày khởi hành" value={formatDateSafe(booking.departureDate)} />
                <InfoItem label="Ngày tạo" value={formatDateSafe(booking.createdAt)} />
                <InfoItem label="Cập nhật" value={formatDateSafe(booking.updatedAt)} />
              </InfoGrid>
            </InfoCard>

            <InfoCard title="Liên hệ">
              <InfoGrid>
                <InfoItem label="Họ tên" value={booking.contactInfo?.fullName || booking.user?.fullName} />
                <InfoItem label="Số điện thoại" value={booking.contactInfo?.phoneNumber} />
                <InfoItem
                  label="Email"
                  value={booking.contactInfo?.email || booking.user?.email || "--"}
                  full
                />
              </InfoGrid>
            </InfoCard>

            <InfoCard title="Hành khách">
              <InfoGrid>
                <InfoItem label="Người lớn" value={booking.guests?.adults ?? 0} />
                <InfoItem label="Trẻ em" value={booking.guests?.children ?? 0} />
                <InfoItem label="Em bé" value={booking.guests?.infants ?? 0} />
                <InfoItem label="Tổng số khách" value={getTotalGuests(booking)} />
              </InfoGrid>
            </InfoCard>

            <InfoCard title="Thanh toán">
              <InfoGrid>
                <InfoItem label="Phương thức" value={getPaymentMethodLabel(booking.paymentMethod)} />
                <InfoItem label="Trạng thái" value={getPaymentStatusLabel(booking.paymentStatus)} />
                <InfoItem label="Tổng tiền" value={formatVnd(booking.totalAmount || 0)} />
                <InfoItem label="Đặt cọc" value={formatVnd(booking.depositAmount || 0)} />
                <InfoItem
                  label="Còn lại"
                  value={formatVnd(Math.max(Number(booking.totalAmount || 0) - Number(booking.depositAmount || 0), 0))}
                />
                <InfoItem label="Đã thanh toán lúc" value={formatDateSafe(booking.paidAt)} />
              </InfoGrid>
            </InfoCard>

            <InfoCard title="Chi phí" className="xl:col-span-2">
              <InfoGrid>
                <InfoItem label="Đơn giá" value={formatVnd(booking.pricing?.unitPrice || 0)} />
                <InfoItem label="Giảm mỗi khách" value={formatVnd(booking.pricing?.discountPerGuest || 0)} />
                <InfoItem label="Tiền tour" value={formatVnd(booking.pricing?.baseAmount || 0)} />
                <InfoItem
                  label="Phụ thu phòng đơn"
                  value={formatVnd(booking.pricing?.singleRoomSupplement || 0)}
                />
              </InfoGrid>
            </InfoCard>

            {(booking.specialRequest || booking.note || booking.cancellationReason) && (
              <InfoCard title="Ghi chú" className="xl:col-span-2">
                <div className="grid gap-4">
                  {booking.specialRequest ? (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Yêu cầu đặc biệt
                      </div>
                      <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {booking.specialRequest}
                      </div>
                    </div>
                  ) : null}

                  {booking.note ? (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Ghi chú nội bộ
                      </div>
                      <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {booking.note}
                      </div>
                    </div>
                  ) : null}

                  {booking.cancellationReason ? (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Lý do huỷ
                      </div>
                      <div className="mt-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {booking.cancellationReason}
                      </div>
                    </div>
                  ) : null}
                </div>
              </InfoCard>
            )}
          </div>

          <section className="space-y-3">
            <h4 className="text-base font-semibold text-slate-900">Giao dịch thanh toán</h4>

            {(booking.paymentTransactions || []).length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chưa có giao dịch thanh toán.
              </div>
            ) : (
              <div className="space-y-3">
                {(booking.paymentTransactions || []).map((transaction) => (
                  <div
                    key={transaction._id}
                    className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-slate-900">
                          {transaction.transactionCode || "--"}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">Phương thức</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {getPaymentMethodLabel(transaction.method)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">Trạng thái</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {getTransactionStatusLabel(transaction.status)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">Số tiền</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {transaction.amount != null ? formatVnd(transaction.amount) : "--"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">Thời gian</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {formatDateSafe(transaction.createdAt)}
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </BookingModal>
  );
}