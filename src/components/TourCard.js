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

function getCoverStyle(imageUrl) {
  if (!imageUrl) {
    return { background: fallbackCover };
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.42)), url("${imageUrl}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

function getDurationLabel(days, nights) {
  if (!Number.isFinite(days) || !Number.isFinite(nights)) {
    return "Lịch trình linh hoạt";
  }

  return `${days}N${nights}Đ`;
}

function getTourCode(tour) {
  return tour.slug?.toUpperCase() || tour.id || "BETOURIST";
}

function getAvailableSeatsLabel(availableSeats) {
  return Number.isFinite(availableSeats) ? availableSeats : "Đang cập nhật";
}

export default function TourCard({ tour }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 w-full" style={getCoverStyle(tour.imageUrl)}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
            {tour.destination}
          </span>
          {tour.category?.name ? (
            <span className="rounded-full bg-sky-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {tour.category.name}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-center border-t border-white/30 bg-white/94 text-sm font-semibold backdrop-blur-sm">
          <div className="flex flex-1 items-center justify-center gap-1 border-r border-slate-200 py-2 text-sky-700">
            <CalendarIcon />
            <span>Khởi hành gần nhất</span>
          </div>
          <div className="flex-1 py-2 text-center text-rose-600">{formatDateVi(tour.firstStartDate)}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/tour/${tour.slug}`}>
          <h3 className="line-clamp-2 text-[15px] font-bold text-slate-800 transition-colors hover:text-sky-600">
            {tour.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TicketIcon className="h-4 w-4" />
          <span className="truncate">{getTourCode(tour)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <PinIcon className="h-4 w-4 text-slate-400" />
          <span>
            Khởi hành: <span className="font-medium text-sky-700">{tour.departureLocation}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span>
            Ngày khởi hành: <span>{formatDateVi(tour.firstStartDate)}</span>
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            <span>{getDurationLabel(tour.durationDays, tour.durationNights)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <GroupIcon className="h-4 w-4 text-slate-400" />
            <span>
              Số chỗ còn: <span className="font-bold text-rose-600">{getAvailableSeatsLabel(tour.availableSeats)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-slate-100 p-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Giá từ:</span>
            {tour.discountPrice ? <span className="line-through">{formatVnd(tour.price)}</span> : null}
          </div>
          <div className="text-xl font-bold text-rose-600">{formatVnd(tour.displayPrice)}</div>
        </div>

        <Link
          href={`/tour/${tour.slug}`}
          className="rounded-md border border-rose-500 px-5 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          Đặt ngay
        </Link>
      </div>
    </article>
  );
}
