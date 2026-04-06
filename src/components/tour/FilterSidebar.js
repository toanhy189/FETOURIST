"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getTours } from "@/apiService/tours";

export default function FilterSidebar({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Khởi tạo State bộ lọc (formData)
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    startDate: searchParams.get("startDate") || "",
    departure: searchParams.get("departure") || "",
    category: searchParams.get("category") || "",
    duration: searchParams.get("duration") || "",
    priceRange: searchParams.get("priceRange") || "",
  });

  // 2. State lưu danh sách địa điểm (giống trang chủ)
  const [departureLocations, setDepartureLocations] = useState([]);

  // 3. Lấy danh sách địa điểm động từ Database
  useEffect(() => {
    const fetchDeparturePoints = async () => {
      try {
        const response = await getTours({ limit: 100 });
        if (response && response.tours) {
          // Lọc các địa điểm duy nhất từ trường departureLocation
          const uniquePoints = [
            ...new Set(response.tours.map((tour) => tour.departureLocation)),
          ].filter(Boolean);
          setDepartureLocations(uniquePoints);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách điểm khởi hành:", error);
      }
    };
    fetchDeparturePoints();
  }, []);

  // 4. Đồng bộ với URL khi quay lại trang hoặc bấm Back
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      startDate: searchParams.get("startDate") || "",
      departure: searchParams.get("departure") || "",
      category: searchParams.get("category") || "",
      duration: searchParams.get("duration") || "",
      priceRange: searchParams.get("priceRange") || "",
    });
  }, [searchParams]);

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.delete("page");
    router.push(`/danh-muc?${params.toString()}`);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <div className="h-5 w-1 rounded-full bg-orange-500"></div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          Tìm Kiếm Nhanh
        </h2>
      </div>

      {/* --- MỤC KHỞI HÀNH (CODE ĐÃ CHUYỂN ĐỔI TỪ TRANG CHỦ) --- */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">
          Khởi hành từ
        </label>
        <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:bg-white transition-all">
          {/* Icon SVG từ code trang chủ của bạn */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
            className="w-4 h-4 text-slate-400 mr-2 shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          
          <select
            name="departure"
            value={filters.departure}
            onChange={(e) => handleChange("departure", e.target.value)}
            className="w-full text-slate-700 outline-none text-xs font-semibold bg-transparent cursor-pointer"
          >
            <option value="">Tất cả địa điểm</option>
            {departureLocations.map((Location, index) => (
              <option key={index} value={Location}>
                {Location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TÌM KIẾM TỪ KHÓA */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Bạn muốn đi đâu?</label>
        <input
          type="text"
          placeholder="Tên tour, điểm đến..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white transition-all"
        />
      </div>

      {/* NGÀY ĐI */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Ngày khởi hành</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white transition-all cursor-pointer"
        />
      </div>

      {/* NÚT BẤM */}
      <div className="pt-4">
        <button
          onClick={handleApplyFilter}
          className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-600 active:scale-95"
        >
          Áp dụng bộ lọc
        </button>
      </div>
    </div>
  );
}