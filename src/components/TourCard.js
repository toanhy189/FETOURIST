import Link from "next/link";
import { formatDateVi, formatVnd } from "@/utils/format";

// --- CÁC COMPONENT ICON GIỮ NGUYÊN ---
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

export default function TourCard({ tour }) {
  return (
    <article className="group flex flex-col md:flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-sky-200 md:h-[260px] w-full">
      
      {/* 1. PHẦN ẢNH BÊN TRÁI */}
      <div className="relative w-full md:w-[280px] lg:w-[300px] flex-shrink-0 overflow-hidden h-52 md:h-auto">
        <Link href={`/tour/${tour.slug}`} className="block h-full w-full">
          <img 
            src={tour.imageUrl || "/placeholder-tour.jpg"} 
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded bg-sky-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
            {tour.destination}
          </span>
        </div>
      </div>

      {/* 2. PHẦN NỘI DUNG Ở GIỮA - ĐÃ SỬA LỖI ĐÈ CHỮ */}
      <div className="flex flex-1 flex-col justify-between p-5 border-r border-slate-50 min-w-0 bg-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded italic">
               🔥 Bán chạy nhất
             </span>
          </div>
          
          <Link href={`/tour/${tour.slug}`}>
            <h3 className="text-lg font-bold text-slate-800 transition-colors hover:text-sky-600 line-clamp-2 leading-snug">
              {tour.title}
            </h3>
          </Link>
          
          {/* Thay đổi từ Grid sang Flex-Col để tránh đè chữ khi có Sidebar */}
          <div className="mt-3 flex flex-col gap-y-2.5 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <ClockIcon className="text-sky-500 flex-shrink-0 w-5 h-5" />
              <p className="leading-none">
                Thời gian: <span className="font-semibold text-slate-900">{tour.durationDays}N{tour.durationNights}Đ</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <PinIcon className="text-sky-500 flex-shrink-0 w-5 h-5" />
              <p className="leading-none">
                Khởi hành: <span className="font-semibold text-slate-900">{tour.departureLocation}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CalendarIcon className="text-sky-500 flex-shrink-0 w-5 h-5" />
              <p className="leading-none">
                Ngày đi: <span className="font-semibold text-slate-900">{formatDateVi(tour.firstStartDate)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-[10px] border border-slate-200 px-2 py-1 rounded bg-slate-50 text-slate-500 font-medium">Xe Limousine</span>
          <span className="text-[10px] border border-slate-200 px-2 py-1 rounded bg-slate-50 text-slate-500 font-medium">Khách sạn 4-5*</span>
        </div>
      </div>

      {/* 3. PHẦN GIÁ & NÚT ĐẶT */}
      <div className="flex w-full md:w-52 flex-col items-center justify-center bg-slate-50/50 p-6 text-center md:items-end md:text-right flex-shrink-0">
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-1">Giá từ</p>
          <p className="text-2xl font-black text-rose-600 leading-none">
            {formatVnd(tour.displayPrice)}
          </p>
        </div>
        
        <Link
          href={`/tour/${tour.slug}`}
          className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-sky-700 text-center"
        >
          Xem chi tiết
        </Link>
        <p className="mt-3 text-[10px] text-slate-400 italic">
          * Đã bao gồm thuế & phí
        </p>
      </div>

    </article>
  );
}