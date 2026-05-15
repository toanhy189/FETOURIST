"use client";

import Link from "next/link";
import { formatDateVi, formatVnd } from "@/utils/format";

const fallbackCover =
  "linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(3, 105, 161, 0.82), rgba(14, 165, 233, 0.72))";

function TicketIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 8.5A2.5 2.5 0 0 0 6.5 6H17.5A2.5 2.5 0 0 0 20 8.5V10a2 2 0 1 0 0 4v1.5A2.5 2.5 0 0 0 17.5 18H6.5A2.5 2.5 0 0 0 4 15.5V14a2 2 0 1 0 0-4Z" />
      <path d="M12 7v10" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

function PinIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M8 2v4M16 2v4M3.5 9.5h17" />
      <rect x="3" y="5" width="18" height="16" rx="3" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3.5 2" />
    </svg>
  );
}

function GroupIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M15 19.1a9.4 9.4 0 0 0 2.6.4 9.3 9.3 0 0 0 4.1-1 4.1 4.1 0 0 0-7.5-2.5" />
      <path d="M15 19.1v.1A12.3 12.3 0 0 1 8.6 21c-2.3 0-4.5-.6-6.4-1.8v-.1a6.4 6.4 0 0 1 12-3.1" />
      <path d="M12 6.4a3.4 3.4 0 1 1-6.8 0 3.4 3.4 0 0 1 6.8 0Zm8.3 2.2a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z" />
    </svg>
  );
}

function getCardRemainingSeats(tour) {
  const totalRemainingSeats = Number(tour?.totalRemainingSeats);
  if (Number.isFinite(totalRemainingSeats)) {
    return Math.max(totalRemainingSeats, 0);
  }

  if (Array.isArray(tour?.upcomingDepartures)) {
    return tour.upcomingDepartures.reduce((total, departure) => {
      const departureRemainingSeats = Number(departure?.remainingSeats);
      return Number.isFinite(departureRemainingSeats)
        ? total + Math.max(departureRemainingSeats, 0)
        : total;
    }, 0);
  }

  const availableSeats = Number(tour?.availableSeats);
  return Number.isFinite(availableSeats) ? Math.max(availableSeats, 0) : 0;
}

export default function TourCard({ tour }) {
  const remainingSeats = getCardRemainingSeats(tour);

  return (
    <article className="group mx-auto flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-[1.05rem] border border-slate-200/90 bg-white shadow-[0_18px_42px_-30px_rgba(15,23,42,0.88)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_54px_-32px_rgba(15,23,42,0.9)]">
      <div className="relative h-[162px] w-full overflow-hidden" style={{ background: fallbackCover }}>
        {tour.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tour.imageUrl}
              alt={tour.title}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/[0.02] to-slate-950/20" />
          </>
        ) : null}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase text-slate-800 shadow-sm">
            {tour.destination || "Việt Nam"}
          </span>
          {tour.category?.name ? (
            <span className="rounded-full bg-sky-600/95 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              {tour.category.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2 text-[11px] font-black uppercase">
        <span className="inline-flex items-center gap-1.5 text-sky-700">
          <CalendarIcon className="h-3.5 w-3.5" />
          Khởi hành gần nhất
        </span>
        <span className="text-rose-500">{formatDateVi(tour.firstStartDate)}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Link href={`/tour/${tour.slug}`}>
          <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-black leading-snug text-slate-900 transition-colors hover:text-sky-700">
            {tour.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <TicketIcon className="h-3.5 w-3.5" />
          <span className="truncate">Mã: {tour.slug?.toUpperCase() || "TRAVELPTIT"}</span>
        </div>

        <div className="space-y-1.5 text-[12px] text-slate-600">
          <div className="flex items-center gap-2">
            <PinIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">
              Khởi hành: <span className="font-bold text-sky-700">{tour.departureLocation}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <span>Ngày: {formatDateVi(tour.firstStartDate)}</span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              {tour.durationDays}N{tour.durationNights}Đ
            </span>
            <span className="flex items-center gap-1.5">
              <GroupIcon className="h-4 w-4 text-slate-400" />
              Còn: <span className="font-black text-rose-500">{remainingSeats}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3.5">
        <div>
          <span className="block text-[10px] font-black uppercase text-slate-400">Giá từ:</span>
          <div className="text-[1.2rem] font-black leading-tight text-rose-500">
            {formatVnd(tour.displayPrice)}
          </div>
        </div>

        <Link
          href={`/tour/${tour.slug}`}
          className="rounded-lg border border-rose-400 px-4 py-2 text-xs font-black text-slate-900 transition-all hover:bg-rose-500 hover:text-white"
        >
          Đặt ngay
        </Link>
      </div>
    </article>
  );
}
