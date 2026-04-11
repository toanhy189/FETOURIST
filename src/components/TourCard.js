import Link from "next/link";
import { formatDateVi, formatVnd } from "@/utils/format";

const fallbackCover =
  "linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(3, 105, 161, 0.82), rgba(14, 165, 233, 0.72))";

// --- Các Icon giữ nguyên như code cũ của bạn ---
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

// --- Helper functions ---
function getCoverStyle(imageUrl) {
  if (!imageUrl) return { background: fallbackCover };
  return {
    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.3)), url("${imageUrl}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

export default function TourCard({ tour }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl w-full max-w-[380px] mx-auto md:mx-0">
      
      {/* 1. Phần hình ảnh - Fix chiều cao để tạo cảm giác ô vuông */}
      <div className="relative h-52 w-full overflow-hidden" style={getCoverStyle(tour.imageUrl)}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Badge địa điểm & loại hình */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm uppercase">
            {tour.destination || "Việt Nam"}
          </span>
          {tour.category?.name && (
            <span className="rounded-full bg-sky-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm uppercase">
              {tour.category.name}
            </span>
          )}
        </div>

        {/* Thanh ngày khởi hành sát cạnh dưới ảnh */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center bg-white/95 text-[11px] font-bold backdrop-blur-sm border-t border-slate-100">
          <div className="flex flex-1 items-center justify-center gap-1 py-2 text-sky-700 border-r border-slate-100">
            <CalendarIcon className="h-3 w-3" />
            <span>KHỞI HÀNH GẦN NHẤT</span>
          </div>
          <div className="flex-1 py-2 text-center text-rose-600">
            {formatDateVi(tour.firstStartDate)}
          </div>
        </div>
      </div>

      {/* 2. Phần nội dung */}
      <div className="flex flex-col gap-3 p-4">
        <Link href={`/tour/${tour.slug}`}>
          <h3 className="line-clamp-2 text-[14px] font-extrabold text-slate-800 transition-colors hover:text-sky-600 leading-snug h-[40px]">
            {tour.title}
          </h3>
        </Link>

        {/* Mã tour nhỏ gọn */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          <TicketIcon className="h-3 w-3" />
          <span className="truncate">MÃ: {tour.slug?.toUpperCase() || "BETOURIST"}</span>
        </div>

        {/* Thông tin chi tiết */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <PinIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">
              Khởi hành: <span className="font-semibold text-sky-700">{tour.departureLocation}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Ngày: {formatDateVi(tour.firstStartDate)}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{tour.durationDays}N{tour.durationNights}Đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <GroupIcon className="h-4 w-4 text-slate-400" />
              <span>Còn: <span className="font-bold text-rose-400">{tour.availableSeats || 0}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Phần giá và nút đặt */}
      <div className="mt-auto flex items-center justify-between border-t border-slate-50 p-4 bg-slate-50/30">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Giá từ:</span>
          <div className="text-lg font-black text-rose-400">
            {formatVnd(tour.displayPrice)}
          </div>
        </div>

        <Link
          href={`/tour/${tour.slug}`}
          className="rounded-lg border-2 border-rose-400 px-4 py-1.5 text-xs font-bold text-rose-400 transition-all hover:bg-rose-400 hover:text-white active:scale-95"
        >
          Đặt ngay
        </Link>
      </div>
    </article>
  );
}