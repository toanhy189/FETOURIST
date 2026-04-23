"use client";

import { formatDateTimeVi, formatVnd } from "@/utils/format";
import { cn } from "@/utils/cn";

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

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  const styles =
    normalized === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "processing" || normalized === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "failed" || normalized === "cancelled"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", styles)}>
      {status || "unknown"}
    </span>
  );
}

function MethodBadge({ method }) {
  return (
    <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase text-sky-700">
      {method || "N/A"}
    </span>
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
            Booking {transaction.booking?.orderCode || "---"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {formatDateTimeVi(transaction.createdAt)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MethodBadge method={transaction.method} />
            <StatusBadge status={transaction.status} />
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

export default function PaymentTab({ payments }) {
  const transactions = payments?.transactions || [];
  const summary = payments?.summary || {};

  return (
    <div className="space-y-6">
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

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Lịch sử giao dịch</h3>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionCard key={transaction._id} transaction={transaction} />
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-base font-medium text-slate-700">Chưa có giao dịch nào</p>
              <p className="mt-2 text-sm text-slate-500">
                Khi bạn thanh toán booking, lịch sử giao dịch sẽ hiển thị tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}