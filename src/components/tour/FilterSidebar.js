"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function FilterSidebar({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- 1. KHỞI TẠO STATE TỔNG HỢP ---
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    startDate: searchParams.get("startDate") || "",
    category: searchParams.get("category") || "",
    duration: searchParams.get("duration") || "",
    priceRange: searchParams.get("priceRange") || "",
  });

  // --- 2. ĐỒNG BỘ VỚI URL (KHI CHUYỂN TRANG HOẶC BẤM NÚT TÌM TỪ TRANG CHỦ) ---
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      startDate: searchParams.get("startDate") || "",
      category: searchParams.get("category") || "",
      duration: searchParams.get("duration") || "",
      priceRange: searchParams.get("priceRange") || "",
    });
  }, [searchParams]);

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // --- 3. HÀM ÁP DỤNG BỘ LỌC ---
  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();

    // Chỉ đưa vào URL những giá trị có chọn
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.delete("page"); // Reset về trang 1 khi lọc mới
    router.push(`/danh-muc?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/danh-muc");
  };

  return (
    <div className="space-y-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <div className="h-5 w-1 rounded-full bg-orange-500"></div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          Tìm Kiếm Nhanh
        </h2>
      </div>

      {/* SECTION 1: TÌM KIẾM TỪ KHÓA (Thay thế SearchForm cũ) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400">Bạn muốn đi đâu?</label>
        <input
          type="text"
          placeholder="Tên tour, điểm đến..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      {/* SECTION 2: NGÀY KHỞI HÀNH */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400">Ngày khởi hành</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white transition-all"
        />
      </div>

      {/* SECTION 3: VÙNG MIỀN / DANH MỤC */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400">Vùng miền</label>
        <select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:bg-white transition-all"
        >
          <option value="">Tất cả</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* SECTION 4: SỐ NGÀY TOUR */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400">Số ngày tour</label>
        <div className="grid grid-cols-1 gap-2">
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
                className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className={`text-xs transition-colors ${filters.duration === item.value ? "text-sky-600 font-bold" : "text-slate-600 group-hover:text-sky-600"}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* SECTION 5: MỨC GIÁ */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase text-slate-400">Mức giá ngân sách</label>
        <select
          value={filters.priceRange}
          onChange={(e) => handleChange("priceRange", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:bg-white transition-all"
        >
          <option value="">Tất cả mức giá</option>
          <option value="0-3000000">Dưới 3 triệu</option>
          <option value="3000000-5000000">3 - 5 triệu</option>
          <option value="5000000-10000000">5 - 10 triệu</option>
          <option value="10000000-100000000">Trên 10 triệu</option>
        </select>
      </div>

      {/* HÀNH ĐỘNG */}
      <div className="pt-4 space-y-3">
        <button
          onClick={handleApplyFilter}
          className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-600 active:scale-95"
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