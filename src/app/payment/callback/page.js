"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatVnd } from "../../../utils/format";
import { cn } from "../../../utils/cn";

function PaymentResultContent() {
  const searchParams = useSearchParams();

  // Lấy các tham số quan trọng từ URL mà VNPay trả về
  const responseCode = searchParams.get("vnp_ResponseCode");
  const transactionNo = searchParams.get("vnp_TransactionNo");
  const amountStr = searchParams.get("vnp_Amount");
  const orderInfo = searchParams.get("vnp_OrderInfo");
  const txnRef = searchParams.get("vnp_TxnRef");

  // VNPay trả về số tiền nhân 100, nên phải chia lại cho 100
  const actualAmount = amountStr ? Number(amountStr) / 100 : 0;

  // "00" là mã thành công duy nhất của VNPay
  const isSuccess = responseCode === "00";

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center mt-10">
      <div
        className={cn(
          "mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6",
          isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        )}
      >
        {isSuccess ? (
          // Icon Check (Thành công)
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          // Icon X (Thất bại)
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
        {isSuccess ? "Thanh toán thành công!" : "Thanh toán không thành công"}
      </h1>
      
      <p className="text-slate-600 mb-8">
        {isSuccess 
          ? "Cảm ơn bạn đã đặt tour. Dưới đây là thông tin giao dịch của bạn." 
          : "Giao dịch đã bị hủy hoặc xảy ra lỗi. Vui lòng kiểm tra lại."}
      </p>

      {/* Box thông tin giao dịch */}
      <div className="rounded-2xl bg-slate-50 p-5 text-left space-y-3 mb-8 border border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Mã giao dịch:</span>
          <span className="font-medium text-slate-900">{txnRef || "---"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Mã tham chiếu VNPay:</span>
          <span className="font-medium text-slate-900">{transactionNo || "---"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Nội dung:</span>
          <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">
            {orderInfo || "---"}
          </span>
        </div>
        <div className="flex justify-between text-base pt-3 border-t border-slate-200 mt-3">
          <span className="font-semibold text-slate-900">Số tiền:</span>
          <span className={cn("font-bold", isSuccess ? "text-emerald-700" : "text-rose-700")}>
            {formatVnd(actualAmount)}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/tai-khoan"
          className="rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 text-center"
        >
          Xem lịch sử đặt tour
        </Link>
        <Link
          href="/"
          className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 text-center"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

// Bọc component trong Suspense vì useSearchParams() sẽ báo lỗi nếu build Next.js thiếu nó
export default function PaymentCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <Suspense fallback={
        <div className="mt-20 text-center text-slate-500 flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-700 mb-4"></div>
          Đang kiểm tra kết quả giao dịch...
        </div>
      }>
        <PaymentResultContent />
      </Suspense>
    </div>
  );
}