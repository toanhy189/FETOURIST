"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getTours } from "@/apiService/tours";

export default function FilterSidebar({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. State cho các bộ lọc
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    startDate: searchParams.get("startDate") || "",
    departure: searchParams.get("departure") || "",
    category: searchParams.get("category") || "",
    duration: searchParams.get("duration") || "",
    priceRange: searchParams.get("priceRange") || "",
  });

  // 2. State lưu danh sách địa điểm khởi hành động
  const [departureLocations, setDepartureLocations] = useState([]);

  // 3. Lấy danh sách địa điểm khởi hành từ API (Lọc từ tất cả các tour)
  useEffect(() => {
    const fetchDeparturePoints = async () => {
      try {
        // Gọi API lấy tour (không truyền tham số lọc để lấy được tất cả các điểm đi hiện có)
        const response = await getTours({ limit: 100 }); 
        if (response && response.tours) {
          // Lấy giá trị từ trường departureLocation (đúng theo DB của bạn)
          const uniquePoints = [
            ...new Set(response.tours.map((tour) => tour.departureLocation)),
          ].filter(Boolean); // Loại bỏ các giá trị null hoặc rỗng
          
          setDepartureLocations(uniquePoints);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách điểm khởi hành:", error);
      }
    };
    fetchDeparturePoints();
  }, []);

  // 4. Cập nhật State mỗi khi URL thay đổi
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

  const handleReset = () => {
    router.push("/danh-muc");
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <div className="h-5 w-1 rounded-full bg-orange-500"></div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          Tìm Kiếm Nhanh
        </h2>
      </div>

      {/* MỤC 1: TÌM KIẾM TỪ KHÓA */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Bạn muốn đi đâu?</label>
        <input
          type="text"
          placeholder="Tên tour, điểm đến..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      {/* MỤC 2: NGÀY KHỞI HÀNH */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Ngày khởi hành</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white transition-all cursor-pointer"
        />
      </div>

      {/* MỤC 3: KHỞI HÀNH TỪ (SỬA LẠI ĐỂ MAP ĐÚNG departureLocation) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Khởi hành từ</label>
        <select
          value={filters.departure}
          onChange={(e) => handleChange("departure", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:bg-white transition-all cursor-pointer"
        >
          <option value="">Tất cả địa điểm</option>
          {departureLocations.length > 0 ? (
            departureLocations.map((location, index) => (
              <option key={index} value={location}>
                {location}
              </option>
            ))
          ) : (
            <option disabled>Đang tải dữ liệu...</option>
          )}
        </select>
      </div>

      {/* VÙNG MIỀN */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Vùng miền</label>
        <select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:bg-white transition-all cursor-pointer"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* SỐ NGÀY TOUR */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Số ngày tour</label>
        <div className="grid grid-cols-1 gap-2 pl-1">
          {[
            { label: "Tất cả thời gian", value: "" },
            { label: "1-2 ngày", value: "1-2" },
            { label: "3-4 ngày", value: "3-4" },
            { label: "5 ngày", value: "5-5" },
            { label: "6 ngày trở lên", value: "6-20" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="duration"
                checked={filters.duration === item.value}
                onChange={() => handleChange("duration", item.value)}
                className="h-4 w-4 border-slate-300 text-orange-500 focus:ring-orange-400"
              />
              <span className={`text-xs transition-colors ${filters.duration === item.value ? "text-orange-600 font-bold" : "text-slate-600 group-hover:text-orange-500"}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* MỨC GIÁ TOUR */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Mức giá tour</label>
        <select
          value={filters.priceRange}
          onChange={(e) => handleChange("priceRange", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:bg-white transition-all cursor-pointer"
        >
          <option value="">Tất cả mức giá</option>
          <option value="0-3000000">Dưới 3 triệu</option>
          <option value="3000000-5000000">3 - 5 triệu</option>
          <option value="5000000-10000000">5 - 10 triệu</option>
          <option value="10000000-100000000">Trên 10 triệu</option>
        </select>
      </div>

      {/* ACTIONS */}
      <div className="pt-4 space-y-3">
        <button
          onClick={handleApplyFilter}
          className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-600 hover:shadow-orange-200 active:scale-95"
        >
          Áp dụng bộ lọc
        </button>
        <button
          onClick={handleReset}
          className="w-full py-2 text-center text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    </div>
  );
}