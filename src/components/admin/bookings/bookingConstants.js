export const PAYMENT_METHODS = ["cash", "vnpay"];
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"];
export const PAYMENT_STATUSES = ["pending", "partially_paid", "paid", "refunded", "failed"];
export const TRANSACTION_STATUSES = ["pending", "processing", "success", "failed", "cancelled"];

export const BOOKING_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export const PAYMENT_METHOD_LABELS = {
  cash: "Tiền mặt",
  vnpay: "VNPay",
};

export const BOOKING_STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Chờ thanh toán",
  partially_paid: "Thanh toán một phần",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
  failed: "Thanh toán thất bại",
};

export const TRANSACTION_STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  success: "Thành công",
  failed: "Thất bại",
  cancelled: "Đã hủy",
};

// helper dùng chung
export function getPaymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || method || "--";
}

export function getBookingStatusLabel(status) {
  return BOOKING_STATUS_LABELS[status] || status || "--";
}

export function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status || "--";
}

export function getTransactionStatusLabel(status) {
  return TRANSACTION_STATUS_LABELS[status] || status || "--";
}

export const DEPARTURE_STATUS_LABELS = {
  open: "Mở",
  full: "Hết chỗ",
  closed: "Đóng",
  cancelled: "Đã hủy",
  completed: "Đã kết thúc",
};

export function getDepartureStatusLabel(status) {
  return DEPARTURE_STATUS_LABELS[status] || status || "--";
}