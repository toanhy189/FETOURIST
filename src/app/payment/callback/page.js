"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatVnd } from "../../../utils/format";
import { cn } from "../../../utils/cn";
import { confirmVNPayReturn } from "@/apiService/payments";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [serverResult, setServerResult] = useState(null);
  const [error, setError] = useState("");

  const rawParams = useMemo(() => {
    return Object.fromEntries(searchParams.entries());
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    async function verifyReturn() {
      try {
        setLoading(true);
        setError("");

        const result = await confirmVNPayReturn(rawParams);
        if (!ignore) {
          setServerResult(result);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Không xác nhận được kết quả thanh toán.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (Object.keys(rawParams).length > 0) {
      void verifyReturn();
    } else {
      setLoading(false);
      setError("Thiếu dữ liệu trả về từ VNPay.");
    }

    return () => {
      ignore = true;
    };
  }, [rawParams]);

  const responseCode = searchParams.get("vnp_ResponseCode");
  const transactionNo = searchParams.get("vnp_TransactionNo");
  const amountStr = searchParams.get("vnp_Amount");
  const orderInfo = searchParams.get("vnp_OrderInfo");
  const txnRef = searchParams.get("vnp_TxnRef");
  const actualAmount = amountStr ? Number(amountStr) / 100 : 0;

  const isSuccess =
    !error &&
    (serverResult?.isSuccess === true || responseCode === "00");

  if (loading) {
    return (
      <div className="mt-20 text-center text-slate-500 flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-700 mb-4"></div>
        Đang xác nhận kết quả giao dịch...
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full",
          isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        )}
      >
        {isSuccess ? (
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <h1 className="mb-2 font-display text-2xl font-bold text-slate-900">
        {isSuccess ? "Thanh toán thành công!" : "Thanh toán không thành công"}
      </h1>

      <p className="mb-8 text-slate-600">
        {error
          ? error
          : isSuccess
            ? "Giao dịch đã được xác nhận. Dưới đây là thông tin thanh toán của bạn."
            : "Giao dịch đã bị hủy hoặc xảy ra lỗi. Vui lòng kiểm tra lại."}
      </p>

      <div className="mb-8 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left">
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
          <span className="max-w-[200px] truncate text-right font-medium text-slate-900">
            {orderInfo || "---"}
          </span>
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base">
          <span className="font-semibold text-slate-900">Số tiền:</span>
          <span className={cn("font-bold", isSuccess ? "text-emerald-700" : "text-rose-700")}>
            {formatVnd(actualAmount)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/tai-khoan"
          className="rounded-full bg-sky-700 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-600"
        >
          Xem lịch sử đặt tour
        </Link>
        <Link
          href="/"
          className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <Suspense
        fallback={
          <div className="mt-20 flex flex-col items-center text-center text-slate-500">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-700"></div>
            Đang kiểm tra kết quả giao dịch...
          </div>
        }
      >
        <PaymentResultContent />
      </Suspense>
    </div>
  );
}