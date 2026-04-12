export const PAYMENT_METHODS = ["cash", "bank_transfer", "credit_card", "e_wallet", "vnpay"];
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"];
export const PAYMENT_STATUSES = ["pending", "partially_paid", "paid", "refunded", "failed"];

export const BOOKING_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export const TRANSACTION_STATUSES = ["pending", "processing", "success", "failed", "cancelled"];